from django.contrib import admin
from .models import Category, Income, Expense, RecurringExpense, Budget


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color', 'user', 'is_default']
    list_filter = ['is_default']


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'source', 'month', 'year']
    list_filter = ['month', 'year']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['user', 'description', 'amount', 'category', 'date', 'is_recurring']
    list_filter = ['category', 'date', 'is_recurring']
    search_fields = ['description', 'notes']


@admin.register(RecurringExpense)
class RecurringExpenseAdmin(admin.ModelAdmin):
    list_display = ['user', 'description', 'amount', 'frequency', 'is_active', 'next_due_date']
    list_filter = ['frequency', 'is_active']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'month', 'year', 'carry_forward']
    list_filter = ['month', 'year']
