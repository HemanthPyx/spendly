from django.db import models
from django.conf import settings


class SavingsGoal(models.Model):
    """A savings target the user is working towards."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='savings_goals'
    )
    name = models.CharField(max_length=300)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.current_amount}/{self.target_amount}"

    @property
    def progress_percentage(self):
        if self.target_amount == 0:
            return 0
        return round((float(self.current_amount) / float(self.target_amount)) * 100, 1)
