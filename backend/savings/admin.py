from django.contrib import admin
from .models import SavingsGoal


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'target_amount', 'current_amount', 'is_completed', 'deadline']
    list_filter = ['is_completed']
    search_fields = ['name']
