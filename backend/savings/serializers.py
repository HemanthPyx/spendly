from rest_framework import serializers
from .models import SavingsGoal


class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'name', 'target_amount', 'current_amount',
            'deadline', 'is_completed', 'progress_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
