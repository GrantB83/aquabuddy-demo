import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo database...');

  // Create demo franchise
  const franchise = await prisma.franchise.create({
    data: {
      name: 'Demo Water Solutions',
      regNumber: 'DEMO123456',
      vatRegistered: true,
      vatNumber: 'VAT123456789',
      address: '123 Demo Street, Demo City, 12345',
    },
  });

  // Create demo store
  const store = await prisma.store.create({
    data: {
      franchiseId: franchise.id,
      name: 'Demo Store',
      code: 'DEMO01',
      address: '456 Store Avenue, Demo City, 12345',
      timezone: 'Africa/Johannesburg',
    },
  });

  // Create demo roles
  const adminRole = await prisma.role.create({
    data: { name: 'admin' },
  });

  const managerRole = await prisma.role.create({
    data: { name: 'manager' },
  });

  const cashierRole = await prisma.role.create({
    data: { name: 'cashier' },
  });

  // Create demo users
  const adminUser = await prisma.user.create({
    data: {
      franchiseId: franchise.id,
      email: 'admin@demo.com',
      phoneE164: '+27123456789',
      passwordHash: '$2b$10$demo.hash.for.demo.purposes.only',
      status: 'ACTIVE',
    },
  });

  // Assign roles to users
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
      franchiseId: franchise.id,
    },
  });

  // Create demo categories
  const waterCategory = await prisma.category.create({
    data: {
      franchiseId: franchise.id,
      name: 'Water Products',
    },
  });

  const equipmentCategory = await prisma.category.create({
    data: {
      franchiseId: franchise.id,
      name: 'Equipment & Supplies',
    },
  });

  // Create demo items
  const waterItem = await prisma.item.create({
    data: {
      franchiseId: franchise.id,
      sku: 'WATER-001',
      name: 'Premium Spring Water 5L',
      categoryId: waterCategory.id,
      price: 25.99,
    },
  });

  const filterItem = await prisma.item.create({
    data: {
      franchiseId: franchise.id,
      sku: 'FILTER-001',
      name: 'Water Filter Cartridge',
      categoryId: equipmentCategory.id,
      price: 89.99,
    },
  });

  // Create demo customers
  const customer1 = await prisma.customer.create({
    data: {
      franchiseId: franchise.id,
      storeId: store.id,
      name: 'John Demo',
      email: 'john@demo.com',
      phoneE164: '+27123456788',
      status: 'ACTIVE',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      franchiseId: franchise.id,
      storeId: store.id,
      name: 'Jane Sample',
      email: 'jane@demo.com',
      phoneE164: '+27123456787',
      status: 'ACTIVE',
    },
  });

  // Create demo employees
  const employee = await prisma.employee.create({
    data: {
      franchiseId: franchise.id,
      storeId: store.id,
      name: 'Demo Employee',
      email: 'employee@demo.com',
      phoneE164: '+27123456786',
    },
  });

  // Create demo invoice
  const invoice = await prisma.invoice.create({
    data: {
      franchiseId: franchise.id,
      storeId: store.id,
      customerId: customer1.id,
      number: 'INV-2024-001',
      status: 'PAID',
      subtotal: 115.98,
      taxTotal: 20.28,
      grandTotal: 136.26,
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Create demo invoice lines
  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice.id,
      itemId: waterItem.id,
      description: 'Premium Spring Water 5L',
      qty: 2,
      unitPrice: 25.99,
      lineTotal: 51.98,
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice.id,
      itemId: filterItem.id,
      description: 'Water Filter Cartridge',
      qty: 1,
      unitPrice: 89.99,
      lineTotal: 89.99,
    },
  });

  // Create demo payment
  await prisma.payment.create({
    data: {
      franchiseId: franchise.id,
      storeId: store.id,
      customerId: customer1.id,
      amount: 136.26,
      method: 'CARD',
      receivedAt: new Date(),
      reference: 'PAY-2024-001',
    },
  });

  console.log('✅ Demo database seeded successfully!');
  console.log(`📊 Created: ${franchise.name} franchise`);
  console.log(`🏪 Created: ${store.name} store`);
  console.log(`👥 Created: ${customer1.name} and ${customer2.name} customers`);
  console.log(`🛍️ Created: ${waterItem.name} and ${filterItem.name} items`);
  console.log(`📄 Created: Invoice ${invoice.number}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
