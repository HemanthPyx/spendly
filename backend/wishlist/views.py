from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistViewSet(viewsets.ModelViewSet):
    """CRUD for wishlist items."""
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        queryset = WishlistItem.objects.filter(user=self.request.user)
        is_purchased = self.request.query_params.get('is_purchased')
        priority = self.request.query_params.get('priority')

        if is_purchased is not None:
            queryset = queryset.filter(is_purchased=is_purchased.lower() == 'true')
        if priority:
            queryset = queryset.filter(priority=priority)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def purchase(self, request, pk=None):
        """Mark a wishlist item as purchased."""
        item = self.get_object()
        item.is_purchased = True
        item.purchased_date = timezone.now().date()
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data)
