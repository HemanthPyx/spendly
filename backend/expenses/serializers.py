from rest_framework import serializers
from django.db.models import Sum
from .models import Category, Income, Expense, RecurringExpense, Budget


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'is_default']


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'amount', 'source', 'month', 'year', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'category', 'category_name', 'category_color', 'category_icon',
            'amount', 'description', 'notes', 'date', 'receipt',
            'is_recurring', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RecurringExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = RecurringExpense
        fields = [
            'id', 'category', 'category_name', 'amount',
            'description', 'frequency', 'is_active', 'next_due_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BudgetSerializer(serializers.ModelSerializer):
    total_expenses = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    percentage_used = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            'id', 'amount', 'month', 'year', 'carry_forward',
            'total_expenses', 'remaining', 'percentage_used',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_expenses(self, obj):
        total = Expense.objects.filter(
            user=obj.user,
            date__month=obj.month,
            date__year=obj.year
        ).aggregate(total=Sum('amount'))['total']
        return float(total or 0)

    def get_remaining(self, obj):
        total_expenses = self.get_total_expenses(obj)
        return float(obj.amount + obj.carry_forward) - total_expenses

    def get_percentage_used(self, obj):
        total_budget = float(obj.amount + obj.carry_forward)
        if total_budget == 0:
            return 0
        total_expenses = self.get_total_expenses(obj)
        return round((total_expenses / total_budget) * 100, 1)
