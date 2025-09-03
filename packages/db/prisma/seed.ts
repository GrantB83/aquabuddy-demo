import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'super_user' },
      update: {},
      create: { name: 'super_user' },
    }),
    prisma.role.upsert({
      where: { name: 'owner' },
      update: {},
      create: { name: 'owner' },
    }),
    prisma.role.upsert({
      where: { name: 'manager' },
      update: {},
      create: { name: 'manager' },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin' },
    }),
    prisma.role.upsert({
      where: { name: 'cashier' },
      update: {},
      create: { name: 'cashier' },
    }),
    prisma.role.upsert({
      where: { name: 'customer' },
      update: {},
      create: { name: 'customer' },
    }),
  ]);

  console.log('✅ Roles created:', roles.map(r => r.name));

  // Create a sample franchise
  const franchise = await prisma.franchise.create({
    data: {
      name: 'Perfect Water Louis Trichardt',
      regNumber: 'REG123456',
      vatRegistered: true,
      vatNumber: 'VAT123456789',
      address: '123 Water Street, Louis Trichardt, Limpopo',
    },
  });

  console.log('✅ Franchise created:', franchise.name);

  // Create a sample store
  const store = await prisma.store.create({
    data: {
      franchiseId: franchise.id,
      name: 'Main Store',
      code: 'LTT001',
      address: '123 Water Street, Louis Trichardt',
      timezone: 'Africa/Johannesburg',
    },
  });

  console.log('✅ Store created:', store.name);

  // Create a sample entity for invoicing
  const entity = await prisma.entity.create({
    data: {
      franchiseId: franchise.id,
      displayName: 'Perfect Water Louis Trichardt',
      address: '123 Water Street, Louis Trichardt, Limpopo',
      phone: '+27123456789',
      email: 'info@pwltt.co.za',
      vatNumber: 'VAT123456789',
    },
  });

  console.log('✅ Entity created:', entity.displayName);

  // Create a sample super user
  const superUser = await prisma.user.create({
    data: {
      email: 'admin@perfectwater.co.za',
      phoneE164: '+27123456789',
      passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8y', // password: admin123
      status: 'ACTIVE',
      roles: {
        create: {
          roleId: roles.find(r => r.name === 'super_user')!.id,
          franchiseId: franchise.id,
        },
      },
    },
  });

  console.log('✅ Super user created:', superUser.email);

  // Create sample tax rates
  const vatRate = await prisma.taxRate.create({
    data: {
      franchiseId: franchise.id,
      name: 'VAT',
      rate: 0.15, // 15%
      activeFrom: new Date(),
    },
  });

  console.log('✅ Tax rate created:', vatRate.name);

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        franchiseId: franchise.id,
        name: 'Water Dispensers',
      },
    }),
    prisma.category.create({
      data: {
        franchiseId: franchise.id,
        name: 'Water Filters',
      },
    }),
    prisma.category.create({
      data: {
        franchiseId: franchise.id,
        name: 'Water Bottles',
      },
    }),
  ]);

  console.log('✅ Categories created:', categories.map(c => c.name));

  // Create sample items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        franchiseId: franchise.id,
        categoryId: categories.find(c => c.name === 'Water Dispensers')!.id,
        sku: 'WD-001',
        name: 'Premium Water Dispenser',
        price: 2500.00,
      },
    }),
    prisma.item.create({
      data: {
        franchiseId: franchise.id,
        categoryId: categories.find(c => c.name === 'Water Filters')!.id,
        sku: 'WF-001',
        name: 'Carbon Water Filter',
        price: 150.00,
      },
    }),
  ]);

  console.log('✅ Items created:', items.map(i => i.name));

  // Create sample inventory
  await Promise.all([
    prisma.inventory.create({
      data: {
        franchiseId: franchise.id,
        storeId: store.id,
        itemId: items.find(i => i.sku === 'WD-001')!.id,
        qtyOnHand: 5,
      },
    }),
    prisma.inventory.create({
      data: {
        franchiseId: franchise.id,
        storeId: store.id,
        itemId: items.find(i => i.sku === 'WF-001')!.id,
        qtyOnHand: 25,
      },
    }),
  ]);

  console.log('✅ Inventory created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
