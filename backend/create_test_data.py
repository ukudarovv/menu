#!/usr/bin/env python
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videomenu.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Tenant, Location, Menu, Category, Item, Price

User = get_user_model()

def create_test_data():
    print("Создание тестовых данных...")
    
    # Создаем тенант
    tenant, created = Tenant.objects.get_or_create(
        slug='demo-restaurant',
        defaults={
            'name': 'Demo Restaurant',
            'description': 'Демонстрационный ресторан',
            'website': 'https://demo-restaurant.com',
            'phone': '+7 (999) 123-45-67',
            'email': 'info@demo-restaurant.com',
            'address': 'ул. Демонстрационная, д. 1',
            'status': 'active',
            'plan': 'premium'
        }
    )
    print(f"Тенант: {'создан' if created else 'уже существует'}")
    
    # Создаем суперпользователя
    admin_user, created = User.objects.get_or_create(
        email='admin@videomenu.com',
        defaults={
            'username': 'admin',
            'first_name': 'Админ',
            'last_name': 'Системы',
            'role': 'owner',
            'status': 'active',
            'tenant': tenant,
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
    print(f"Админ: {'создан' if created else 'уже существует'}")
    
    # Создаем владельца ресторана
    owner_user, created = User.objects.get_or_create(
        email='owner@demo.com',
        defaults={
            'username': 'owner',
            'first_name': 'Владелец',
            'last_name': 'Ресторана',
            'role': 'owner',
            'status': 'active',
            'tenant': tenant
        }
    )
    if created:
        owner_user.set_password('demo123')
        owner_user.save()
    print(f"Владелец: {'создан' if created else 'уже существует'}")
    
    # Создаем локацию
    location, created = Location.objects.get_or_create(
        tenant=tenant,
        name='Основной зал',
        defaults={
            'description': 'Главный зал ресторана',
            'address': 'ул. Демонстрационная, д. 1, 1 этаж',
            'phone': '+7 (999) 123-45-67',
            'email': 'main@demo-restaurant.com',
            'capacity': 50,
            'is_active': True
        }
    )
    print(f"Локация: {'создана' if created else 'уже существует'}")
    
    # Создаем меню
    menu, created = Menu.objects.get_or_create(
        tenant=tenant,
        location=location,
        name='Основное меню',
        defaults={
            'active': True
        }
    )
    print(f"Меню: {'создано' if created else 'уже существует'}")
    
    # Создаем категории
    categories_data = [
        {'name': 'Закуски', 'sort': 1},
        {'name': 'Салаты', 'sort': 2},
        {'name': 'Супы', 'sort': 3},
        {'name': 'Основные блюда', 'sort': 4},
        {'name': 'Десерты', 'sort': 5},
        {'name': 'Напитки', 'sort': 6},
    ]
    
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            tenant=tenant,
            menu=menu,
            name=cat_data['name'],
            defaults={'sort': cat_data['sort']}
        )
        print(f"Категория '{cat_data['name']}': {'создана' if created else 'уже существует'}")
    
    # Создаем блюда
    items_data = [
        {
            'name': 'Брускетта с томатами',
            'description': 'Хрустящий хлеб с помидорами и базиликом',
            'category': 'Закуски',
            'weight_g': 150,
            'kcal': 280,
            'price': 45000,  # 450 рублей в копейках
        },
        {
            'name': 'Цезарь с курицей',
            'description': 'Классический салат с куриной грудкой',
            'category': 'Салаты',
            'weight_g': 300,
            'kcal': 420,
            'price': 65000,  # 650 рублей в копейках
        },
        {
            'name': 'Борщ украинский',
            'description': 'Традиционный борщ со сметаной',
            'category': 'Супы',
            'weight_g': 400,
            'kcal': 350,
            'price': 55000,  # 550 рублей в копейках
        },
        {
            'name': 'Стейк из говядины',
            'description': 'Сочный стейк средней прожарки',
            'category': 'Основные блюда',
            'weight_g': 250,
            'kcal': 520,
            'price': 120000,  # 1200 рублей в копейках
        },
        {
            'name': 'Тирамису',
            'description': 'Классический итальянский десерт',
            'category': 'Десерты',
            'weight_g': 200,
            'kcal': 380,
            'price': 75000,  # 750 рублей в копейках
        },
    ]
    
    for item_data in items_data:
        category = Category.objects.get(tenant=tenant, name=item_data['category'])
        item, created = Item.objects.get_or_create(
            tenant=tenant,
            category=category,
            name=item_data['name'],
            defaults={
                'description': item_data['description'],
                'weight_g': item_data['weight_g'],
                'kcal': item_data['kcal'],
                'sort': 1
            }
        )
        print(f"Блюдо '{item_data['name']}': {'создано' if created else 'уже существует'}")
        
        # Создаем цену
        if created:
            Price.objects.get_or_create(
                item=item,
                defaults={
                    'amount_minor': item_data['price'],
                    'currency': 'RUB'
                }
            )
    
    print("\n✅ Тестовые данные созданы успешно!")
    print(f"Админ: admin@videomenu.com / admin123")
    print(f"Владелец: owner@demo.com / demo123")

if __name__ == '__main__':
    create_test_data()
