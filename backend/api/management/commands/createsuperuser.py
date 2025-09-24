from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Tenant

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superuser with tenant'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email address')
        parser.add_argument('--password', type=str, help='Password')
        parser.add_argument('--tenant-name', type=str, help='Tenant name')
        parser.add_argument('--tenant-slug', type=str, help='Tenant slug')

    def handle(self, *args, **options):
        email = options.get('email') or input('Email: ')
        password = options.get('password') or input('Password: ')
        tenant_name = options.get('tenant_name') or input('Tenant name: ')
        tenant_slug = options.get('tenant_slug') or input('Tenant slug: ')

        # Создаем или получаем tenant
        tenant, created = Tenant.objects.get_or_create(
            slug=tenant_slug,
            defaults={
                'name': tenant_name,
                'plan': 'premium',
                'status': 'active',
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created tenant: {tenant.name}')
            )

        # Создаем суперпользователя
        user = User.objects.create_user(
            email=email,
            password=password,
            tenant=tenant,
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created superuser: {user.email}')
        )
