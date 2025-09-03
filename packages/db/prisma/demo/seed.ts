import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('�� Starting demo data seed...');

  // Create demo users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@demo.com',
        name: 'Demo Admin',
        role: 'admin',
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@demo.com',
        name: 'Demo Manager',
        role: 'manager',
      },
    }),
  ]);

  // Create demo customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1234567890',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+0987654321',
      },
    }),
  ]);

  // Create demo products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Premium Water Filter',
        description: 'High-quality water filtration system',
        price: 299.99,
        category: 'Filters',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Water Dispenser',
        description: 'Modern water dispensing unit',
        price: 599.99,
        category: 'Dispensers',
      },
    }),
  ]);

  console.log('✅ Demo data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
