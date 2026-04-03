from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from expenses.models import Income, Expense
from .models import SavingsGoal
from .serializers import SavingsGoalSerializer


class SavingsGoalViewSet(viewsets.ModelViewSet):
    """CRUD for savings goals."""
    serializer_class = SavingsGoalSerializer

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Get monthly savings summary."""
        month = request.query_params.get('month', timezone.now().month)
        year = request.query_params.get('year', timezone.now().year)
        month = int(month)
        year = int(year)

        total_income = Income.objects.filter(
            user=request.user, month=month, year=year
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_expenses = Expense.objects.filter(
            user=request.user,
            date__month=month,
            date__year=year
        ).aggregate(total=Sum('amount'))['total'] or 0

        savings = float(total_income) - float(total_expenses)

        return Response({
            'month': month,
            'year': year,
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'savings': savings,
        })

    @action(detail=False, methods=['get'])
    def yearly(self, request):
        """Get yearly savings summary."""
        year = request.query_params.get('year', timezone.now().year)
        year = int(year)

        months_data = []
        total_yearly_savings = 0

        for m in range(1, 13):
            income = Income.objects.filter(
                user=request.user, month=m, year=year
            ).aggregate(total=Sum('amount'))['total'] or 0

            expenses = Expense.objects.filter(
                user=request.user,
                date__month=m,
                date__year=year
            ).aggregate(total=Sum('amount'))['total'] or 0

            monthly_savings = float(income) - float(expenses)
            total_yearly_savings += monthly_savings

            months_data.append({
                'month': m,
                'income': float(income),
                'expenses': float(expenses),
                'savings': monthly_savings,
            })

        return Response({
            'year': year,
            'total_savings': total_yearly_savings,
            'months': months_data,
        })
