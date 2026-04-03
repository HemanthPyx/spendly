from django.contrib import admin
from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'price', 'priority', 'is_purchased', 'purchased_date']
    list_filter = ['priority', 'is_purchased']
    search_fields = ['name']
