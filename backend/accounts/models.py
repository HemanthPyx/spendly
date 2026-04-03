from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with expense tracker specific fields."""
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    currency = models.CharField(max_length=10, default='INR')
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reset_code = models.CharField(max_length=10, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.email
