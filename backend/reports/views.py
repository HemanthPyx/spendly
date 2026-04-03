from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
import io

from expenses.models import Expense, Income, Budget, Category
from wishlist.models import WishlistItem
from savings.models import SavingsGoal

import openpyxl
from openpyxl import Workbook
import reportlab
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.colors import HexColor

class DashboardView(APIView):
    """Dashboard summary with all key widgets."""

    def get(self, request):
        today = timezone.now()
        month = int(request.query_params.get('month', today.month))
        year = int(request.query_params.get('year', today.year))

        # Total income this month
        total_income = Income.objects.filter(
            user=request.user, month=month, year=year
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Total expenses this month
        total_expenses = Expense.objects.filter(
            user=request.user, date__month=month, date__year=year
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Remaining balance
        remaining = float(total_income) - float(total_expenses)

        # Top spending category
        top_category = Expense.objects.filter(
            user=request.user, date__month=month, date__year=year
        ).values('category__name', 'category__color').annotate(
            total=Sum('amount')
        ).order_by('-total').first()

        # Recent expenses (5 latest)
        from expenses.serializers import ExpenseSerializer
        recent_expenses = Expense.objects.filter(
            user=request.user
        ).select_related('category')[:5]
        recent_data = ExpenseSerializer(recent_expenses, many=True).data

        # Wishlist progress
        wishlist_total = WishlistItem.objects.filter(user=request.user).count()
        wishlist_completed = WishlistItem.objects.filter(
            user=request.user, is_purchased=True
        ).count()

        # Budget info
        try:
            budget = Budget.objects.get(user=request.user, month=month, year=year)
            budget_amount = float(budget.amount)
            budget_percentage = round((float(total_expenses) / budget_amount) * 100, 1) if budget_amount > 0 else 0
        except Budget.DoesNotExist:
            budget_amount = 0
            budget_percentage = 0

        # Category breakdown for pie chart
        category_breakdown = list(
            Expense.objects.filter(
                user=request.user, date__month=month, date__year=year
            ).values('category__name', 'category__color').annotate(
                total=Sum('amount')
            ).order_by('-total')
        )

        # Average daily spending
        import calendar
        if month == today.month and year == today.year:
            days_passed = max(1, today.day)
        else:
            _, days_passed = calendar.monthrange(year, month)
            
        avg_daily_spending = float(total_expenses) / days_passed if days_passed > 0 else 0

        # Smart Insights Generation
        insights = []
        
        # 1. Savings insight
        if remaining > 0 and total_income > 0:
            savings_rate = (remaining / float(total_income)) * 100
            if savings_rate > 20:
                insights.append(f"Great job! You've saved {round(savings_rate)}% of your income this month.")
        elif total_income > 0 and remaining < 0:
            insights.append("You are spending more than you earn this month. Consider reviewing your expenses.")
            
        # 2. Budget insight
        if budget_percentage >= 100:
            insights.append("⚠️ You have exceeded your budget for this month!")
        elif budget_percentage >= 80:
            insights.append(f"Caution: You have used {budget_percentage}% of your monthly budget.")
            
        # 3. Category insight
        if top_category and total_expenses > 0:
            top_cat_name = top_category['category__name'] or 'Uncategorized'
            top_cat_amount = float(top_category['total'])
            top_cat_pct = (top_cat_amount / float(total_expenses)) * 100
            if top_cat_pct > 30:
                insights.append(f"💡 {top_cat_name} makes up {round(top_cat_pct)}% of your expenses. Consider if you can reduce spending here.")
            
        # 4. Wishlist insight
        if wishlist_total > wishlist_completed and remaining > 0:
            insights.append("You have a positive balance! Maybe it's time to treat yourself to an item from your wishlist.")
            
        if not insights:
            insights.append("Keep tracking your expenses to get smart insights here!")

        return Response({
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'remaining_balance': remaining,
            'budget_amount': budget_amount,
            'budget_percentage': budget_percentage,
            'avg_daily_spending': round(avg_daily_spending, 2),
            'top_category': {
                'name': top_category['category__name'] if top_category else 'N/A',
                'amount': float(top_category['total']) if top_category else 0,
                'color': top_category.get('category__color', '#D53E0F') if top_category else '#D53E0F',
            },
            'recent_expenses': recent_data,
            'insights': insights,
            'wishlist_progress': {
                'total': wishlist_total,
                'completed': wishlist_completed,
            },
            'category_breakdown': [
                {
                    'name': item['category__name'] or 'Uncategorized',
                    'color': item['category__color'] or '#D53E0F',
                    'amount': float(item['total']),
                }
                for item in category_breakdown
            ],
            'month': month,
            'year': year,
        })


class AnalyticsView(APIView):
    """Expense visualization data for charts."""

    def get(self, request):
        year = int(request.query_params.get('year', timezone.now().year))

        # Monthly expenses for bar chart
        monthly_data = []
        for m in range(1, 13):
            total = Expense.objects.filter(
                user=request.user, date__month=m, date__year=year
            ).aggregate(total=Sum('amount'))['total'] or 0
            income = Income.objects.filter(
                user=request.user, month=m, year=year
            ).aggregate(total=Sum('amount'))['total'] or 0
            monthly_data.append({
                'month': m,
                'expenses': float(total),
                'income': float(income),
            })

        # Category breakdown for pie chart
        category_data = list(
            Expense.objects.filter(
                user=request.user, date__year=year
            ).values('category__name', 'category__color').annotate(
                total=Sum('amount')
            ).order_by('-total')
        )

        # Daily expenses for line chart (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        daily_data = list(
            Expense.objects.filter(
                user=request.user, date__gte=thirty_days_ago
            ).values('date').annotate(
                total=Sum('amount')
            ).order_by('date')
        )

        # Average daily spending
        total_30_days = sum(d['total'] for d in daily_data) if daily_data else 0
        avg_daily = float(total_30_days) / 30 if daily_data else 0

        # Highest spending category
        highest = category_data[0] if category_data else None

        return Response({
            'monthly_data': monthly_data,
            'category_data': [
                {
                    'name': item['category__name'] or 'Uncategorized',
                    'color': item['category__color'] or '#D53E0F',
                    'amount': float(item['total']),
                }
                for item in category_data
            ],
            'daily_data': [
                {
                    'date': item['date'].isoformat(),
                    'amount': float(item['total']),
                }
                for item in daily_data
            ],
            'insights': {
                'highest_category': highest['category__name'] if highest else 'N/A',
                'highest_amount': float(highest['total']) if highest else 0,
                'avg_daily_spending': round(avg_daily, 2),
            },
            'year': year,
        })


class ReportView(APIView):
    """Generate financial reports."""

    def get(self, request):
        report_type = request.query_params.get('type', 'monthly')
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))

        if report_type == 'monthly':
            expenses = Expense.objects.filter(
                user=request.user, date__month=month, date__year=year
            ).select_related('category').order_by('date')

            from expenses.serializers import ExpenseSerializer
            expenses_data = ExpenseSerializer(expenses, many=True).data

            total = expenses.aggregate(total=Sum('amount'))['total'] or 0
            income = Income.objects.filter(
                user=request.user, month=month, year=year
            ).aggregate(total=Sum('amount'))['total'] or 0

            category_summary = list(
                expenses.values('category__name').annotate(
                    total=Sum('amount'), count=Count('id')
                ).order_by('-total')
            )

            return Response({
                'type': 'monthly',
                'month': month,
                'year': year,
                'total_expenses': float(total),
                'total_income': float(income),
                'savings': float(income) - float(total),
                'expenses': expenses_data,
                'category_summary': [
                    {
                        'category': item['category__name'] or 'Uncategorized',
                        'total': float(item['total']),
                        'count': item['count'],
                    }
                    for item in category_summary
                ],
            })

        elif report_type == 'weekly':
            import calendar
            from collections import defaultdict
            
            # Group expenses by week (week 1 to week 4/5) of the selected month
            expenses = Expense.objects.filter(
                user=request.user, date__month=month, date__year=year
            ).order_by('date')
            
            weeks_data = defaultdict(float)
            for exp in expenses:
                # Calculate which week of the month this date falls into (1-indexed)
                day_of_month = exp.date.day
                # Simple approximation: Week 1 (1-7), Week 2 (8-14), Week 3 (15-21), Week 4+ (22+)
                week_num = min(4, ((day_of_month - 1) // 7) + 1)
                weeks_data[f"Week {week_num}"] += float(exp.amount)
            
            # Format output for charts
            weekly_chart_data = [
                {'name': f"Week {i}", 'amount': weeks_data.get(f"Week {i}", 0)}
                for i in range(1, 5)
            ]
            
            total = sum(weeks_data.values())

            return Response({
                'type': 'weekly',
                'month': month,
                'year': year,
                'total_expenses': float(total),
                'weekly_summary': weekly_chart_data,
            })

        elif report_type == 'category':
            category_data = list(
                Expense.objects.filter(
                    user=request.user, date__year=year
                ).values('category__name', 'category__color').annotate(
                    total=Sum('amount'), count=Count('id')
                ).order_by('-total')
            )

            return Response({
                'type': 'category',
                'year': year,
                'categories': [
                    {
                        'name': item['category__name'] or 'Uncategorized',
                        'color': item['category__color'] or '#D53E0F',
                        'total': float(item['total']),
                        'count': item['count'],
                    }
                    for item in category_data
                ],
            })

        return Response({'detail': 'Invalid report type.'}, status=status.HTTP_400_BAD_REQUEST)


class ExportReportView(APIView):
    """Export report as PDF or Excel."""

    def get(self, request):
        export_format = request.query_params.get('format', 'excel')
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))

        expenses = Expense.objects.filter(
            user=request.user, date__month=month, date__year=year
        ).select_related('category').order_by('date')

        if export_format == 'excel':
            return self._export_excel(expenses, month, year)
        elif export_format == 'pdf':
            return self._export_pdf(expenses, month, year)

        return Response({'detail': 'Invalid format.'}, status=status.HTTP_400_BAD_REQUEST)

    def _export_excel(self, expenses, month, year):
        from django.http import HttpResponse

        wb = Workbook()
        ws = wb.active
        ws.title = f"Expenses {month}-{year}"

        headers = ['Date', 'Description', 'Category', 'Amount', 'Notes']
        ws.append(headers)

        for expense in expenses:
            ws.append([
                expense.date.isoformat(),
                expense.description,
                expense.category.name if expense.category else 'Uncategorized',
                float(expense.amount),
                expense.notes,
            ])

        # Total row
        total = sum(float(e.amount) for e in expenses)
        ws.append(['', '', 'Total', total, ''])

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=expenses_{month}_{year}.xlsx'
        return response

    def _export_pdf(self, expenses, month, year):
        from django.http import HttpResponse

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title = Paragraph(f"Expense Report - {month}/{year}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 20))

        # Table data
        data = [['Date', 'Description', 'Category', 'Amount']]
        total = 0
        for expense in expenses:
            data.append([
                expense.date.isoformat(),
                expense.description[:40],
                expense.category.name if expense.category else 'N/A',
                f"₹{float(expense.amount):,.2f}",
            ])
            total += float(expense.amount)

        data.append(['', '', 'Total', f"₹{total:,.2f}"])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#5E0006')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#FFFFFF')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#9B0F06')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [HexColor('#FFFFFF'), HexColor('#EED9B9')]),
            ('BACKGROUND', (0, -1), (-1, -1), HexColor('#D53E0F')),
            ('TEXTCOLOR', (0, -1), (-1, -1), HexColor('#FFFFFF')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=expenses_{month}_{year}.pdf'
        return response


class BudgetAlertView(APIView):
    """Get budget alert status."""

    def get(self, request):
        today = timezone.now()
        month = int(request.query_params.get('month', today.month))
        year = int(request.query_params.get('year', today.year))

        try:
            budget = Budget.objects.get(user=request.user, month=month, year=year)
        except Budget.DoesNotExist:
            return Response({
                'has_budget': False,
                'alert': 'none',
                'message': 'No budget set for this month.',
            })

        total_expenses = Expense.objects.filter(
            user=request.user, date__month=month, date__year=year
        ).aggregate(total=Sum('amount'))['total'] or 0

        budget_amount = float(budget.amount) + float(budget.carry_forward)
        total_expenses = float(total_expenses)
        percentage = round((total_expenses / budget_amount) * 100, 1) if budget_amount > 0 else 0

        if percentage >= 100:
            alert = 'exceeded'
            message = f'⚠ Budget exceeded! You have spent ₹{total_expenses:,.0f} of ₹{budget_amount:,.0f}.'
            suggestion = 'Consider reducing non-essential spending for the rest of the month.'
        elif percentage >= 80:
            alert = 'warning'
            message = f'⚠ You have spent {percentage}% of your budget this month.'
            suggestion = 'Try to limit spending to essentials.'
        elif percentage >= 50:
            alert = 'caution'
            message = f'You have used {percentage}% of your budget.'
            suggestion = 'You are on track. Keep monitoring your spending.'
        else:
            alert = 'safe'
            message = f'You have used {percentage}% of your budget.'
            suggestion = 'Great job! You are well within budget.'

        return Response({
            'has_budget': True,
            'budget_amount': budget_amount,
            'total_spent': total_expenses,
            'remaining': budget_amount - total_expenses,
            'percentage': percentage,
            'alert': alert,
            'suggestion': suggestion,
        })


class AIAnalysisView(APIView):
    """Deep AI analysis of spending patterns using Gemini."""

    def get(self, request):
        import json
        import google.generativeai as genai
        from decouple import config
        
        # Configure Gemini API
        api_key = config('GEMINI_API_KEY', default=None)
        if not api_key:
            return Response({'detail': 'GEMINI_API_KEY is not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        genai.configure(api_key=api_key)
        
        # Get data from the last 30 days
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        expenses = Expense.objects.filter(
            user=request.user, date__gte=thirty_days_ago
        ).select_related('category').order_by('-date')
        
        if not expenses.exists():
            return Response({'detail': 'Not enough data for AI analysis. Please add some expenses first.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Format the data for the prompt
        expense_data_str = "Recent Expenses (Last 30 Days):\n"
        total_spent = 0
        cat_totals = {}
        
        for exp in expenses:
            amount = float(exp.amount)
            total_spent += amount
            cat_name = exp.category.name if exp.category else 'Uncategorized'
            cat_totals[cat_name] = cat_totals.get(cat_name, 0) + amount
            expense_data_str += f"- {exp.date}: {exp.description} [{cat_name}] - {amount}\n"
            
        expense_data_str += f"\nTotal Spent: {total_spent}\n"
        expense_data_str += "Category Totals:\n"
        for cat, amt in cat_totals.items():
            expense_data_str += f"- {cat}: {amt}\n"
            
        currency = getattr(request.user, 'currency', '₹')
        
        # Prompt construction
        prompt = f"""
        You are a financial advisor AI. I am providing you with my expense data for the last 30 days. The currency used is {currency}.
        
        {expense_data_str}
        
        Analyze this data and provide a detailed financial analysis in a valid JSON format with the following exact keys:
        - "summary": A brief 2-sentence summary of my spending habits.
        - "wasted_money": Point out specific transactions or categories where I might be wasting money or overspending needlessly.
        - "saving_opportunities": Provide 2-3 specific, actionable suggestions on how I can save money based on this exact data.
        - "positive_habits": Highlight 1 or 2 good financial behaviors you notice in this data.
        
        IMPORTANT: Use rich Markdown formatting (like **bold text**, bulleted lists `-`, and `inline code`) INSIDE the JSON string values to make the output highly readable and formatted beautifully.
        Do not include markdown blocks like ```json in the overall output. Just return the raw JSON object.
        """
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up potential markdown formatting
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            analysis_data = json.loads(response_text)
            
            return Response(analysis_data)
            
        except json.JSONDecodeError:
            return Response({'detail': 'Failed to parse AI response. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'detail': f'Error generating AI analysis: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
