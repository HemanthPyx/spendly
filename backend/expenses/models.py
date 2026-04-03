from django.db import models
from django.conf import settings


class Category(models.Model):
    """Expense category."""
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, default='')
    color = models.CharField(max_length=7, blank=True, default='#D53E0F')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='categories', null=True, blank=True
    )
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Income(models.Model):
    """Monthly income / total amount entry."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='incomes'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(max_length=200, blank=True, default='Salary')
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['user', 'month', 'year', 'source']

    def __str__(self):
        return f"{self.user.email} - {self.month}/{self.year} - {self.amount}"


class Expense(models.Model):
    """Individual expense entry."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses'
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name='expenses'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=500)
    notes = models.TextField(blank=True, default='')
    date = models.DateField()
    receipt = models.ImageField(upload_to='receipts/', blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.description} - {self.amount}"


class RecurringExpense(models.Model):
    """Recurring payment definition."""
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('weekly', 'Weekly'),
        ('yearly', 'Yearly'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recurring_expenses'
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name='recurring_expenses'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=500)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='monthly')
    is_active = models.BooleanField(default=True)
    next_due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['next_due_date']

    def __str__(self):
        return f"{self.description} - {self.amount} ({self.frequency})"


class Budget(models.Model):
    """Monthly budget setting per user."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budgets'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.IntegerField()
    year = models.IntegerField()
    carry_forward = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.user.email} - {self.month}/{self.year} - {self.amount}"
