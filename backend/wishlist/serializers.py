from rest_framework import serializers
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistItem
        fields = [
            'id', 'name', 'price', 'priority', 'is_purchased',
            'purchased_date', 'notes', 'link', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
