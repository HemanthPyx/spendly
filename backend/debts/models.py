from django.db import models
from django.conf import settings


class Debt(models.Model):
    """Track money borrowed from or lent to someone."""

    DEBT_TYPE_CHOICES = [
        ('borrowed', 'Borrowed'),
        ('lent', 'Lent'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='debts'
    )
    person_name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    debt_type = models.CharField(max_length=10, choices=DEBT_TYPE_CHOICES, default='borrowed')
    reason = models.TextField(blank=True, default='')
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['is_paid', '-priority', '-created_at']

    def __str__(self):
        status = '✅' if self.is_paid else '❌'
        return f"{status} {self.debt_type}: {self.person_name} - {self.amount}"


class FCMDevice(models.Model):
    """Store Firebase Cloud Messaging device tokens for push notifications."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fcm_devices'
    )
    token = models.TextField(unique=True)
    device_name = models.CharField(max_length=200, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.device_name or 'Unknown Device'}"
