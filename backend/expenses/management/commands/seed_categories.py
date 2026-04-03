from django.core.management.base import BaseCommand
from expenses.models import Category


DEFAULT_CATEGORIES = [
    {'name': 'Food', 'icon': '🍕', 'color': '#D53E0F'},
    {'name': 'Travel', 'icon': '✈️', 'color': '#9B0F06'},
    {'name': 'Shopping', 'icon': '🛒', 'color': '#5E0006'},
    {'name': 'Bills', 'icon': '📄', 'color': '#EE8A00'},
    {'name': 'Entertainment', 'icon': '🎬', 'color': '#7B2FBE'},
    {'name': 'Education', 'icon': '📚', 'color': '#2563EB'},
    {'name': 'Health', 'icon': '💊', 'color': '#059669'},
    {'name': 'Rent', 'icon': '🏠', 'color': '#DC2626'},
    {'name': 'Subscription', 'icon': '📺', 'color': '#7C3AED'},
    {'name': 'Other', 'icon': '📦', 'color': '#6B7280'},
]


class Command(BaseCommand):
    help = 'Seed default expense categories'

    def handle(self, *args, **kwargs):
        created = 0
        for cat_data in DEFAULT_CATEGORIES:
            _, was_created = Category.objects.get_or_create(
                name=cat_data['name'],
                is_default=True,
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                }
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created} default categories.')
        )
