from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone

from .models import Debt, FCMDevice
from .serializers import DebtSerializer, FCMDeviceSerializer


class DebtViewSet(viewsets.ModelViewSet):
    """CRUD for debt tracking."""
    serializer_class = DebtSerializer

    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark a debt as paid and optionally create an expense entry."""
        debt = self.get_object()

        if debt.is_paid:
            return Response(
                {'detail': 'This debt is already marked as paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        debt.is_paid = True
        debt.paid_date = timezone.now().date()
        debt.save()

        # Auto-create expense entry if it's a borrowed debt (you're paying back)
        if debt.debt_type == 'borrowed':
            from expenses.models import Expense, Category
            # Try to find or create a "Debt Payment" category
            category, _ = Category.objects.get_or_create(
                user=request.user,
                name='Debt Payment',
                defaults={'color': '#9B0F06', 'icon': '💳'}
            )
            Expense.objects.create(
                user=request.user,
                description=f"Debt repaid to {debt.person_name}",
                amount=debt.amount,
                category=category,
                date=timezone.now().date(),
                notes=f"Auto-created from debt tracker. Reason: {debt.reason}",
            )

        return Response(DebtSerializer(debt).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get debt summary stats."""
        debts = self.get_queryset()
        today = timezone.now().date()

        total_borrowed = debts.filter(
            debt_type='borrowed', is_paid=False
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_lent = debts.filter(
            debt_type='lent', is_paid=False
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_paid = debts.filter(
            is_paid=True
        ).aggregate(total=Sum('amount'))['total'] or 0

        overdue_count = debts.filter(
            is_paid=False, due_date__lt=today
        ).count()

        active_count = debts.filter(is_paid=False).count()

        return Response({
            'total_borrowed': float(total_borrowed),
            'total_lent': float(total_lent),
            'total_outstanding': float(total_borrowed) + float(total_lent),
            'total_paid': float(total_paid),
            'overdue_count': overdue_count,
            'active_count': active_count,
        })

    @action(detail=False, methods=['get'])
    def reminders(self, request):
        """Get unpaid debts that need attention (for dashboard widget)."""
        today = timezone.now().date()
        unpaid = self.get_queryset().filter(is_paid=False)

        # Overdue debts
        overdue = unpaid.filter(due_date__lt=today)
        # Due this month
        due_soon = unpaid.filter(
            due_date__gte=today,
            due_date__month=today.month,
            due_date__year=today.year
        )
        # No due date but still unpaid
        no_date = unpaid.filter(due_date__isnull=True)

        return Response({
            'overdue': DebtSerializer(overdue, many=True).data,
            'due_soon': DebtSerializer(due_soon, many=True).data,
            'no_due_date': DebtSerializer(no_date, many=True).data,
            'total_unpaid': float(
                unpaid.aggregate(total=Sum('amount'))['total'] or 0
            ),
        })


class FCMDeviceViewSet(viewsets.ModelViewSet):
    """Register and manage FCM device tokens."""
    serializer_class = FCMDeviceSerializer

    def get_queryset(self):
        return FCMDevice.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        token = serializer.validated_data['token']
        # Upsert: update if token exists, create if not
        device, created = FCMDevice.objects.update_or_create(
            token=token,
            defaults={
                'user': self.request.user,
                'device_name': serializer.validated_data.get('device_name', ''),
                'is_active': True,
            }
        )
        if not created:
            serializer.instance = device

    def create(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            return Response(
                {'detail': 'Token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        device, created = FCMDevice.objects.update_or_create(
            token=token,
            defaults={
                'user': request.user,
                'device_name': request.data.get('device_name', ''),
                'is_active': True,
            }
        )
        return Response(
            FCMDeviceSerializer(device).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
