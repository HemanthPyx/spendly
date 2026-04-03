import json
import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum

from debts.models import Debt, FCMDevice

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Send Firebase push notifications for unpaid debts (run daily via cron)'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        sent_count = 0
        error_count = 0

        users = User.objects.all()

        for user in users:
            # Get unpaid debts
            unpaid_debts = Debt.objects.filter(user=user, is_paid=False)

            if not unpaid_debts.exists():
                continue

            total_unpaid = float(
                unpaid_debts.aggregate(total=Sum('amount'))['total'] or 0
            )
            overdue = unpaid_debts.filter(due_date__lt=today)
            overdue_count = overdue.count()
            active_count = unpaid_debts.count()

            # Build notification message
            if overdue_count > 0:
                title = f"⚠️ {overdue_count} Overdue Debt{'s' if overdue_count > 1 else ''}!"
                body = f"You have {active_count} unpaid debt{'s' if active_count > 1 else ''} totalling ₹{total_unpaid:,.0f}. {overdue_count} {'are' if overdue_count > 1 else 'is'} overdue!"
            else:
                title = f"💰 Debt Reminder"
                body = f"You have {active_count} unpaid debt{'s' if active_count > 1 else ''} totalling ₹{total_unpaid:,.0f}. Don't forget to settle them!"

            # Get user's FCM device tokens
            devices = FCMDevice.objects.filter(user=user, is_active=True)

            if not devices.exists():
                self.stdout.write(
                    self.style.WARNING(f'No FCM devices for {user.email}, skipping push notification.')
                )
                continue

            for device in devices:
                try:
                    self._send_fcm_notification(
                        token=device.token,
                        title=title,
                        body=body,
                        data={
                            'type': 'debt_reminder',
                            'total_unpaid': str(total_unpaid),
                            'active_count': str(active_count),
                            'overdue_count': str(overdue_count),
                        }
                    )
                    sent_count += 1
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'Failed to send to {user.email} ({device.device_name}): {e}')
                    )
                    # Deactivate invalid tokens
                    if 'not-registered' in str(e).lower() or 'invalid' in str(e).lower():
                        device.is_active = False
                        device.save()
                        self.stdout.write(
                            self.style.WARNING(f'Deactivated invalid token for {user.email}')
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Debt reminders sent: {sent_count} successful, {error_count} failed.'
            )
        )

    def _send_fcm_notification(self, token, title, body, data=None):
        """Send a push notification via Firebase Cloud Messaging."""
        try:
            import firebase_admin
            from firebase_admin import messaging
        except ImportError:
            self.stdout.write(
                self.style.ERROR(
                    'firebase-admin is not installed. Run: pip install firebase-admin'
                )
            )
            return

        # Initialize Firebase app if not already initialized
        if not firebase_admin._apps:
            import os
            from decouple import config

            cred_path = config('FIREBASE_CREDENTIALS_PATH', default='')
            if cred_path and os.path.exists(cred_path):
                cred = firebase_admin.credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                self.stdout.write(
                    self.style.ERROR(
                        'FIREBASE_CREDENTIALS_PATH not set or file not found. '
                        'Download your Firebase service account JSON and set the path in .env'
                    )
                )
                return

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )

        response = messaging.send(message)
        self.stdout.write(self.style.SUCCESS(f'Sent notification: {response}'))
