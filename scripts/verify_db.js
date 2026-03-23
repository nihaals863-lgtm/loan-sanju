const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    const loanCount = await prisma.loan.count();
    console.log('Total loans in DB:', loanCount);
    const pendingLoans = await prisma.loan.count({ where: { status: 'PENDING' } });
    console.log('Pending loans:', pendingLoans);
  } catch (err) {
    console.error('Database connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
