const bcrypt = require('bcryptjs');
const { PrismaClient, AccountType, Frequency, TransactionType } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Logement', type: TransactionType.EXPENSE, color: '#4B5563', icon: 'home' },
  { name: 'Alimentation', type: TransactionType.EXPENSE, color: '#059669', icon: 'shopping-cart' },
  { name: 'Transport', type: TransactionType.EXPENSE, color: '#0EA5E9', icon: 'truck' },
  { name: 'Abonnements', type: TransactionType.EXPENSE, color: '#8B5CF6', icon: 'repeat' },
  { name: 'Loisirs', type: TransactionType.EXPENSE, color: '#F59E0B', icon: 'smile' },
  { name: 'Sante', type: TransactionType.EXPENSE, color: '#EC4899', icon: 'activity' },
  { name: 'Impots', type: TransactionType.EXPENSE, color: '#EF4444', icon: 'percent' },
  { name: 'Credit', type: TransactionType.EXPENSE, color: '#7C3AED', icon: 'credit-card' },
  { name: 'Epargne', type: TransactionType.EXPENSE, color: '#14B8A6', icon: 'target' },
  { name: 'Autre', type: null, color: '#6B7280', icon: 'tag' },
  { name: 'Salaire', type: TransactionType.INCOME, color: '#16A34A', icon: 'dollar-sign' },
  { name: 'Prime', type: TransactionType.INCOME, color: '#10B981', icon: 'gift' },
];

async function main() {
  const demoEmail = process.env.DEMO_EMAIL || 'demo@budget.app';
  const demoPassword = process.env.DEMO_PASSWORD || 'demo1234';

  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      passwordHash,
      name: 'Demo User',
      currentBalance: 2800,
      goalAmount: 12000,
    },
    update: {
      passwordHash,
      currentBalance: 2800,
      goalAmount: 12000,
    },
  });

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        userId: user.id,
        name: 'CIC',
        type: AccountType.BANK,
        currentBalance: 1800,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: 'Boursobank',
        type: AccountType.BANK,
        currentBalance: 800,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: 'Metaux precieux',
        type: AccountType.PRECIOUS_METALS,
        currentBalance: 120,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: 'Portefeuille crypto',
        type: AccountType.CRYPTO,
        currentBalance: 80,
      },
    }),
  ]);

  const getAccountId = (name) =>
    accounts.find((account) => account.name === name)?.id || null;

  const categories = [];
  for (const category of DEFAULT_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
      },
    });
    categories.push(created);
  }

  const getCategoryId = (name) =>
    categories.find((category) => category.name === name)?.id || null;

  const now = new Date();
  const year = now.getFullYear();

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: getAccountId('CIC'),
        title: 'Salaire principal',
        amount: 3200,
        type: TransactionType.INCOME,
        frequency: Frequency.MONTHLY,
        date: new Date(year, 0, 2),
        categoryId: getCategoryId('Salaire'),
        note: 'Revenu mensuel principal',
      },
      {
        userId: user.id,
        accountId: getAccountId('CIC'),
        title: 'Loyer',
        amount: 980,
        type: TransactionType.EXPENSE,
        frequency: Frequency.MONTHLY,
        date: new Date(year, 0, 5),
        categoryId: getCategoryId('Logement'),
      },
      {
        userId: user.id,
        accountId: getAccountId('CIC'),
        title: 'Abonnement telephone',
        amount: 29.99,
        type: TransactionType.EXPENSE,
        frequency: Frequency.MONTHLY,
        date: new Date(year, 0, 10),
        categoryId: getCategoryId('Abonnements'),
      },
      {
        userId: user.id,
        accountId: getAccountId('Boursobank'),
        title: 'Courses',
        amount: 95,
        type: TransactionType.EXPENSE,
        frequency: Frequency.WEEKLY,
        date: new Date(year, 0, 6),
        categoryId: getCategoryId('Alimentation'),
      },
      {
        userId: user.id,
        accountId: getAccountId('Boursobank'),
        title: 'Essence',
        amount: 70,
        type: TransactionType.EXPENSE,
        frequency: Frequency.MONTHLY,
        date: new Date(year, 0, 14),
        categoryId: getCategoryId('Transport'),
      },
      {
        userId: user.id,
        accountId: getAccountId('CIC'),
        title: 'Prime annuelle',
        amount: 1500,
        type: TransactionType.INCOME,
        frequency: Frequency.ONCE,
        date: new Date(year, 6, 12),
        categoryId: getCategoryId('Prime'),
      },
      {
        userId: user.id,
        accountId: getAccountId('CIC'),
        title: 'Vacances ete',
        amount: 1800,
        type: TransactionType.EXPENSE,
        frequency: Frequency.ONCE,
        date: new Date(year, 7, 8),
        categoryId: getCategoryId('Loisirs'),
      },
    ],
  });

  console.log('Seed termine.');
  console.log(`Compte demo: ${demoEmail} / ${demoPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
