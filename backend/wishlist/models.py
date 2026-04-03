from django.db import models
from django.conf import settings


class WishlistItem(models.Model):
    """Item user wants to buy later."""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items'
    )
    name = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_purchased = models.BooleanField(default=False)
    purchased_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    link = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = '✔' if self.is_purchased else 'Pending'
        return f"{self.name} - ₹{self.price} - {status}"
