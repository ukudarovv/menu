const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Инициализация базы данных...')

  try {
    // Создаем суперадмин тенант
    const superTenant = await prisma.tenant.upsert({
      where: { id: 'superadmin-tenant' },
      update: {},
      create: {
        id: 'superadmin-tenant',
        name: 'Super Admin',
        slug: 'superadmin',
        plan: 'enterprise',
        status: 'active',
      }
    })

    // Создаем суперадмина
    const superAdmin = await prisma.user.upsert({
      where: { 
        tenantId_email: {
          email: 'admin@videomenu.com',
          tenantId: 'superadmin-tenant'
        }
      },
      update: {},
      create: {
        id: 'superadmin-user',
        tenantId: 'superadmin-tenant',
        email: 'admin@videomenu.com',
        passwordHash: await bcrypt.hash('admin123', 12),
        role: 'superadmin',
        status: 'active',
      }
    })

    console.log('✅ Суперадмин создан:', superAdmin.email)

    // Создаем демо ресторан
    const demoTenant = await prisma.tenant.upsert({
      where: { slug: 'demo-restaurant' },
      update: {},
      create: {
        name: 'Демо Ресторан',
        slug: 'demo-restaurant',
        plan: 'pro',
        status: 'active',
      }
    })

    // Создаем владельца демо ресторана
    const demoOwner = await prisma.user.upsert({
      where: { 
        tenantId_email: {
          email: 'owner@demo.com',
          tenantId: demoTenant.id
        }
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        email: 'owner@demo.com',
        passwordHash: await bcrypt.hash('demo123', 12),
        role: 'owner',
        status: 'active',
      }
    })

    // Создаем локацию
    const location = await prisma.location.upsert({
      where: { 
        id: 'demo-location',
        tenantId: demoTenant.id
      },
      update: {},
      create: {
        id: 'demo-location',
        tenantId: demoTenant.id,
        name: 'Основная локация',
        timezone: 'Europe/Moscow',
        currency: 'RUB',
        locale: 'ru',
      }
    })

    // Создаем меню
    const menu = await prisma.menu.upsert({
      where: { 
        id: 'demo-menu',
        tenantId: demoTenant.id
      },
      update: {},
      create: {
        id: 'demo-menu',
        tenantId: demoTenant.id,
        locationId: location.id,
        name: 'Основное меню',
        active: true,
      }
    })

    // Создаем категории
    const categories = [
      { name: 'Закуски', sort: 1 },
      { name: 'Основные блюда', sort: 2 },
      { name: 'Десерты', sort: 3 },
      { name: 'Напитки', sort: 4 },
    ]

    const createdCategories = []
    for (const categoryData of categories) {
      const category = await prisma.category.upsert({
        where: { 
          id: `demo-category-${categoryData.sort}`,
          tenantId: demoTenant.id
        },
        update: {},
        create: {
          id: `demo-category-${categoryData.sort}`,
          tenantId: demoTenant.id,
          menuId: menu.id,
          name: categoryData.name,
          sort: categoryData.sort,
        }
      })
      createdCategories.push(category)
    }

    // Создаем демо блюда
    const demoItems = [
      {
        name: 'Цезарь с курицей',
        description: 'Свежий салат с куриной грудкой, пармезаном и соусом цезарь',
        categoryId: createdCategories[0].id,
        tags: ['салат', 'курица', 'свежий'],
        allergens: ['глютен', 'молочные продукты'],
        weightG: 250,
        kcal: 320,
        price: 450,
      },
      {
        name: 'Стейк из говядины',
        description: 'Сочный стейк из мраморной говядины с овощами гриль',
        categoryId: createdCategories[1].id,
        tags: ['мясо', 'стейк', 'гриль'],
        allergens: [],
        weightG: 300,
        kcal: 520,
        price: 1200,
      },
      {
        name: 'Тирамису',
        description: 'Классический итальянский десерт с кофе и маскарпоне',
        categoryId: createdCategories[2].id,
        tags: ['десерт', 'кофе', 'итальянский'],
        allergens: ['яйца', 'молочные продукты'],
        weightG: 150,
        kcal: 380,
        price: 350,
      },
      {
        name: 'Свежевыжатый апельсиновый сок',
        description: 'Натуральный сок из свежих апельсинов',
        categoryId: createdCategories[3].id,
        tags: ['сок', 'свежий', 'натуральный'],
        allergens: [],
        weightG: 250,
        kcal: 110,
        price: 180,
      },
    ]

    for (const itemData of demoItems) {
      const item = await prisma.item.upsert({
        where: { 
          id: `demo-item-${itemData.name.toLowerCase().replace(/\s+/g, '-')}`,
          tenantId: demoTenant.id
        },
        update: {},
        create: {
          id: `demo-item-${itemData.name.toLowerCase().replace(/\s+/g, '-')}`,
          tenantId: demoTenant.id,
          categoryId: itemData.categoryId,
          name: itemData.name,
          description: itemData.description,
          tags: JSON.stringify(itemData.tags),
          allergens: JSON.stringify(itemData.allergens),
          weightG: itemData.weightG,
          kcal: itemData.kcal,
          sort: Math.random() * 100,
        }
      })

      // Создаем цену
      await prisma.price.upsert({
        where: { 
          id: `demo-price-${item.id}`,
          itemId: item.id
        },
        update: {},
        create: {
          id: `demo-price-${item.id}`,
          itemId: item.id,
          currency: 'RUB',
          amountMinor: itemData.price * 100, // в копейках
        }
      })
    }

    // Создаем тему
    await prisma.theme.upsert({
      where: { tenantId: demoTenant.id },
      update: {},
      create: {
        tenantId: demoTenant.id,
        paletteJson: JSON.stringify({
          primary: '#0ea5e9',
          secondary: '#d946ef',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
        }),
      }
    })

    console.log('✅ Демо ресторан создан:', demoTenant.name)
    console.log('✅ Демо меню доступно по адресу: /menu/demo-restaurant')
    console.log('')
    console.log('🔑 Учетные данные:')
    console.log('Суперадмин: admin@videomenu.com / admin123')
    console.log('Владелец демо: owner@demo.com / demo123')
    console.log('')
    console.log('🎉 Инициализация завершена!')

  } catch (error) {
    console.error('❌ Ошибка инициализации:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
