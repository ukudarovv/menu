import os
import django
from django.conf import settings

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videomenu.settings')
django.setup()

from api.models import User, Tenant, Location, Menu, Category, Item, Price, MediaAsset, ItemMedia

def create_demo_data():
    print("Создание демо данных...")
    
    # Создаем или получаем tenant
    tenant, created = Tenant.objects.get_or_create(
        slug='demo-restaurant',
        defaults={
            'name': 'Demo Restaurant',
            'plan': 'premium',
            'status': 'active',
        }
    )
    
    if created:
        print(f'Создан tenant: {tenant.name}')
    else:
        print(f'Используем существующий tenant: {tenant.name}')
    
    # Создаем локацию
    location, created = Location.objects.get_or_create(
        tenant=tenant,
        name='Основной зал',
        defaults={
            'description': 'Главный зал ресторана',
            'address': 'ул. Демо, 1',
            'phone': '+7 (XXX) XXX-XX-XX',
            'email': 'info@demo-restaurant.com',
            'capacity': 50,
            'is_active': True,
        }
    )
    
    if created:
        print(f'Создана локация: {location.name}')
    else:
        print(f'Используем существующую локацию: {location.name}')
    
    # Создаем меню
    menu, created = Menu.objects.get_or_create(
        tenant=tenant,
        location=location,
        name='Основное меню',
        defaults={
            'active': True,
        }
    )
    
    if created:
        print(f'Создано меню: {menu.name}')
    else:
        print(f'Используем существующее меню: {menu.name}')
    
    # Создаем категории
    categories_data = [
        {'name': 'Закуски', 'sort': 1},
        {'name': 'Основные блюда', 'sort': 2},
        {'name': 'Десерты', 'sort': 3},
        {'name': 'Напитки', 'sort': 4},
    ]
    
    categories = []
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            tenant=tenant,
            menu=menu,
            name=cat_data['name'],
            defaults={
                'sort': cat_data['sort'],
            }
        )
        categories.append(category)
        if created:
            print(f'Создана категория: {category.name}')
        else:
            print(f'Используем существующую категорию: {category.name}')
    
    # Создаем блюда
    items_data = [
        {
            'name': 'Брускетта с томатами',
            'description': 'Свежие томаты на поджаренном хлебе с базиликом',
            'category': categories[0],  # Закуски
            'weight_g': 150,
            'kcal': 280,
            'price': 45000,  # 450 рублей в копейках
            'tags': ['вегетарианское', 'свежее'],
            'allergens': ['глютен'],
        },
        {
            'name': 'Стейк из говядины',
            'description': 'Сочный стейк средней прожарки с картофелем',
            'category': categories[1],  # Основные блюда
            'weight_g': 300,
            'kcal': 650,
            'price': 120000,  # 1200 рублей в копейках
            'tags': ['мясо', 'сытное'],
            'allergens': [],
        },
        {
            'name': 'Тирамису',
            'description': 'Классический итальянский десерт с кофе и маскарпоне',
            'category': categories[2],  # Десерты
            'weight_g': 120,
            'kcal': 420,
            'price': 35000,  # 350 рублей в копейках
            'tags': ['десерт', 'кофе'],
            'allergens': ['глютен', 'молочные продукты', 'яйца'],
        },
        {
            'name': 'Свежевыжатый апельсиновый сок',
            'description': 'Натуральный сок из свежих апельсинов',
            'category': categories[3],  # Напитки
            'weight_g': 250,
            'kcal': 110,
            'price': 18000,  # 180 рублей в копейках
            'tags': ['натуральный', 'витамины'],
            'allergens': [],
        },
    ]
    
    for item_data in items_data:
        item, created = Item.objects.get_or_create(
            tenant=tenant,
            category=item_data['category'],
            name=item_data['name'],
            defaults={
                'description': item_data['description'],
                'weight_g': item_data['weight_g'],
                'kcal': item_data['kcal'],
                'tags': item_data['tags'],
                'allergens': item_data['allergens'],
            }
        )
        
        if created:
            print(f'Создано блюдо: {item.name}')
            
            # Создаем цену
            Price.objects.create(
                item=item,
                amount_minor=item_data['price'],
                currency='RUB',
            )
            print(f'Создана цена для {item.name}: {item_data["price"]/100} руб.')
        else:
            print(f'Используем существующее блюдо: {item.name}')
    
    print("Демо данные созданы успешно!")
    print(f"Tenant: {tenant.name} (slug: {tenant.slug})")
    print(f"Локация: {location.name}")
    print(f"Меню: {menu.name}")
    print(f"Категории: {[cat.name for cat in categories]}")
    print(f"Блюда: {[item.name for item in Item.objects.filter(tenant=tenant)]}")

if __name__ == '__main__':
    create_demo_data()
