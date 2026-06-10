from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Renombra superusers con username 'admin' para evitar uso de credenciales obvias."

    def handle(self, *args, **kwargs):
        count = 0
        for user in User.objects.filter(is_superuser=True, username__iexact='admin'):
            user.username = f'superuser_{user.pk}'
            user.save(update_fields=['username'])
            count += 1
        self.stdout.write(self.style.SUCCESS(f'Superusers actualizados: {count}'))
