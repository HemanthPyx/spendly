from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from .models import Category, Income, Expense, RecurringExpense, Budget
from .serializers import (
    CategorySerializer, IncomeSerializer, ExpenseSerializer,
    RecurringExpenseSerializer, BudgetSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for expense categories."""
    serializer_class = CategorySerializer

    def get_queryset(self):
        from django.db.models import Q
        return Category.objects.filter(
            Q(user=self.request.user) | Q(is_default=True)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class IncomeViewSet(viewsets.ModelViewSet):
    """CRUD for income entries."""
    serializer_class = IncomeSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['month', 'year', 'amount']

    def get_queryset(self):
        queryset = Income.objects.filter(user=self.request.user)
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    """CRUD for expenses with filtering and search."""
    serializer_class = ExpenseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'notes', 'category__name']
    ordering_fields = ['amount', 'date', 'created_at']

    def get_queryset(self):
        queryset = Expense.objects.filter(user=self.request.user)
        # Filters
        category = self.request.query_params.get('category')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')

        if category:
            queryset = queryset.filter(category_id=category)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def ocr(self, request):
        """Simulate OCR extraction from a receipt image."""
        receipt = request.FILES.get('receipt')
        if not receipt:
            return Response({'detail': 'No receipt image provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        import json
        import google.generativeai as genai
        from decouple import config
        from PIL import Image
        
        # Configure Gemini API
        api_key = config('GEMINI_API_KEY', default=None)
        if not api_key:
            return Response({'detail': 'GEMINI_API_KEY is not configured in environment variables.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        genai.configure(api_key=api_key)
        
        try:
            # Load the uploaded image
            img = Image.open(receipt)
            
            # Prepare the prompt for Gemini
            model = genai.GenerativeModel('gemini-2.5-flash')
            prompt = """
            Analyze this receipt image and extract the following information. 
            Respond ONLY with a valid JSON object. Do not include any markdown formatting like ```json.
            
            Fields to extract:
            - amount: The total amount numerical value only (float). If not found, use 0.0.
            - date: The date of the receipt in YYYY-MM-DD format. If not found, use today's date.
            - description: A short description of the expense or the vendor name.
            - category_name: The most appropriate expense category (e.g., Food, Transport, Utilities, Shopping, Entertainment, Health, Transfer, etc.)
            """
            
            response = model.generate_content([prompt, img])
            response_text = response.text.strip()
            
            # Clean up potential markdown formatting if Gemini still includes it
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            ocr_data = json.loads(response_text)
            
            return Response(ocr_data)
            
        except json.JSONDecodeError:
            return Response({'detail': 'Failed to parse the receipt data. Please try a clearer image.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': f'Error processing receipt: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecurringExpenseViewSet(viewsets.ModelViewSet):
    """CRUD for recurring payments."""
    serializer_class = RecurringExpenseSerializer

    def get_queryset(self):
        return RecurringExpense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def process_due(self, request):
        """Process all due recurring expenses and create actual expense entries."""
        today = timezone.now().date()
        due_expenses = RecurringExpense.objects.filter(
            user=request.user,
            is_active=True,
            next_due_date__lte=today
        )

        created_count = 0
        for recurring in due_expenses:
            Expense.objects.create(
                user=request.user,
                category=recurring.category,
                amount=recurring.amount,
                description=f"[Recurring] {recurring.description}",
                date=recurring.next_due_date,
                is_recurring=True,
            )

            # Update next due date
            if recurring.frequency == 'monthly':
                month = recurring.next_due_date.month % 12 + 1
                year = recurring.next_due_date.year + (1 if month == 1 else 0)
                recurring.next_due_date = recurring.next_due_date.replace(month=month, year=year)
            elif recurring.frequency == 'weekly':
                from datetime import timedelta
                recurring.next_due_date += timedelta(days=7)
            elif recurring.frequency == 'yearly':
                recurring.next_due_date = recurring.next_due_date.replace(
                    year=recurring.next_due_date.year + 1
                )
            recurring.save()
            created_count += 1

        return Response({'detail': f'{created_count} recurring expenses processed.'})


class BudgetViewSet(viewsets.ModelViewSet):
    """CRUD for monthly budgets."""
    serializer_class = BudgetSerializer

    def get_queryset(self):
        queryset = Budget.objects.filter(user=self.request.user)
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current month's budget with alert status."""
        today = timezone.now()
        try:
            budget = Budget.objects.get(
                user=request.user,
                month=today.month,
                year=today.year
            )
            serializer = self.get_serializer(budget)
            data = serializer.data

            # Add alert info
            percentage = data['percentage_used']
            if percentage >= 100:
                data['alert'] = 'exceeded'
                data['alert_message'] = 'You have exceeded your budget this month!'
            elif percentage >= 80:
                data['alert'] = 'warning'
                data['alert_message'] = f'You have spent {percentage}% of your budget this month.'
            else:
                data['alert'] = 'safe'
                data['alert_message'] = ''

            return Response(data)
        except Budget.DoesNotExist:
            return Response({
                'detail': 'No budget set for the current month.',
                'alert': 'none'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def init_month(self, request):
        """Auto-carry budget and income from the previous month to the current month.
        If no budget/income exists for the current month, copy from the previous one."""
        today = timezone.now()
        current_month = today.month
        current_year = today.year

        # Calculate previous month
        if current_month == 1:
            prev_month, prev_year = 12, current_year - 1
        else:
            prev_month, prev_year = current_month - 1, current_year

        results = {'budget': None, 'incomes': []}

        # --- Budget auto-carry ---
        current_budget = Budget.objects.filter(
            user=request.user, month=current_month, year=current_year
        ).first()

        if not current_budget:
            prev_budget = Budget.objects.filter(
                user=request.user, month=prev_month, year=prev_year
            ).first()
            if prev_budget:
                current_budget = Budget.objects.create(
                    user=request.user,
                    amount=prev_budget.amount,
                    month=current_month,
                    year=current_year,
                )
                results['budget'] = f'Budget ₹{prev_budget.amount} carried from {prev_month}/{prev_year}'
            else:
                results['budget'] = 'No previous budget found to carry.'
        else:
            results['budget'] = f'Budget already set for {current_month}/{current_year}'

        # --- Income auto-carry ---
        current_incomes = Income.objects.filter(
            user=request.user, month=current_month, year=current_year
        )
        if not current_incomes.exists():
            prev_incomes = Income.objects.filter(
                user=request.user, month=prev_month, year=prev_year
            )
            for prev_inc in prev_incomes:
                Income.objects.create(
                    user=request.user,
                    amount=prev_inc.amount,
                    source=prev_inc.source,
                    month=current_month,
                    year=current_year,
                )
                results['incomes'].append(f'{prev_inc.source}: ₹{prev_inc.amount}')
            if not results['incomes']:
                results['incomes'] = ['No previous income found to carry.']
        else:
            results['incomes'] = ['Income already exists for this month.']

        return Response({
            'detail': 'Month initialized successfully.',
            'budget': results['budget'],
            'incomes': results['incomes'],
            'month': current_month,
            'year': current_year,
        })
