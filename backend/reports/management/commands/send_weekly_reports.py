from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils.html import strip_tags
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from expenses.models import Expense
from django.db.models import Sum

User = get_user_model()

class Command(BaseCommand):
    help = 'Sends a weekly expense summary email to all users'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        one_week_ago = today - timedelta(days=7)

        users = User.objects.all()
        sent_count = 0

        for user in users:
            if not user.email:
                continue

            # Fetch expenses for the last 7 days
            expenses = Expense.objects.filter(
                user=user,
                date__gte=one_week_ago,
                date__lt=today
            )
            
            total_spent = expenses.aggregate(total=Sum('amount'))['total'] or 0
            total_spent = float(total_spent)
            
            if total_spent == 0:
                continue

            currency = getattr(user, 'currency', '₹')
            subject = 'Your Weekly Expense Report 📊'
            
            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #5E0006;">Your Weekly Expense Summary</h2>
                <p>Hello,</p>
                <p>Here is your spending summary for the week of <strong>{one_week_ago.strftime('%b %d, %Y')}</strong> to <strong>{today.strftime('%b %d, %Y')}</strong>.</p>
                <div style="background-color: #EED9B9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0; color: #D53E0F;">Total Spent: {currency}{total_spent:,.2f}</h3>
                </div>
                <h4>Top Expenses This Week:</h4>
                <ul style="line-height: 1.6;">
            """
            
            for exp in expenses.order_by('-amount')[:5]:
                cat_name = exp.category.name if exp.category else 'Uncategorized'
                amount_formatted = f"{currency}{float(exp.amount):,.2f}"
                html_message += f"<li><strong>{exp.date}</strong>: {exp.description} ({cat_name}) - <span style='color: #D53E0F;'>{amount_formatted}</span></li>"
                
            html_message += """
                </ul>
                <p style="margin-top: 30px; font-size: 14px; color: #666;">Log in to your dashboard for more details.</p>
                <p style="font-size: 12px; color: #999;">This is an automated message from Expense Tracker.</p>
            </div>
            """
            
            plain_message = strip_tags(html_message)
            
            try:
                send_mail(
                    subject,
                    plain_message,
                    'noreply@expensetracker.com',
                    [user.email],
                    html_message=html_message,
                    fail_silently=False,
                )
                sent_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to send email to {user.email}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully sent {sent_count} weekly reports.'))
