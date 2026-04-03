from rest_framework import serializers
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile details."""

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name',
                  'avatar', 'currency', 'monthly_budget', 'created_at']
        read_only_fields = ['id', 'email', 'created_at']


class CustomRegisterSerializer(RegisterSerializer):
    """Extended registration serializer with first/last name."""
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        return data

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get('first_name', '')
        user.last_name = self.cleaned_data.get('last_name', '')
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth token."""
    token = serializers.CharField(required=True)
