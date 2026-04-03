from django.contrib import admin
from .models import Debt, FCMDevice


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ['user', 'person_name', 'amount', 'debt_type', 'is_paid', 'due_date', 'priority']
    list_filter = ['debt_type', 'is_paid', 'priority']
    search_fields = ['person_name', 'reason']


@admin.register(FCMDevice)
class FCMDeviceAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_name', 'is_active', 'created_at']
    list_filter = ['is_active']
