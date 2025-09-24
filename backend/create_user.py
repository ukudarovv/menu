#!/usr/bin/env python
import os
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videomenu.settings')
django.setup()

from api.models import User, Tenant

# Создаем или получаем tenant
tenant, created = Tenant.objects.get_or_create(
    slug='demo',
    defaults={
        'name': 'Demo Restaurant',
        'plan': 'premium',
        'status': 'active',
    }
)

if created:
    print(f'Created tenant: {tenant.name}')
else:
    print(f'Using existing tenant: {tenant.name}')

# Создаем суперпользователя
user, created = User.objects.get_or_create(
    email='ukudarovv@gmail.com',
    defaults={
        'tenant': tenant,
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True
    }
)

if created:
    user.set_password('admin123')
    user.save()
    print(f'Successfully created superuser: {user.email}')
else:
    print(f'User already exists: {user.email}')
    # Обновляем пароль
    user.set_password('admin123')
    user.save()
    print('Password updated')

print(f'Total users: {User.objects.count()}')
print(f'Total tenants: {Tenant.objects.count()}')
print(f'Superusers: {User.objects.filter(is_superuser=True).count()}')
