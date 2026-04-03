from rest_framework import serializers
from .models import Debt, FCMDevice


class DebtSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Debt
        fields = [
            'id', 'person_name', 'amount', 'debt_type', 'reason',
            'due_date', 'priority', 'is_paid', 'paid_date',
            'is_overdue', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_overdue', 'created_at', 'updated_at']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.is_paid or not obj.due_date:
            return False
        return obj.due_date < timezone.now().date()


class FCMDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMDevice
        fields = ['id', 'token', 'device_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
