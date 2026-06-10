from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Anonimiza usuarios inactivos durante mas de 2 anos (RGPD).'

    def handle(self, *args, **kwargs):
        cutoff = timezone.now() - timedelta(days=730)
        qs = User.objects.filter(last_activity_at__lt=cutoff, is_active=True)

        updated = 0
        with transaction.atomic():
            for user in qs.iterator():
                user.first_name = 'Anonimo'
                user.last_name = 'Anonimo'
                user.phone = ''
                user.bio = ''
                user.specialty = ''
                user.email = f'anon-{user.pk}-{int(timezone.now().timestamp())}@deleted.local'
                user.is_active = False
                user.save(update_fields=[
                    'first_name',
                    'last_name',
                    'phone',
                    'bio',
                    'specialty',
                    'email',
                    'is_active',
                    'updated_at',
                ])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f'Usuarios anonimizados: {updated}'))
