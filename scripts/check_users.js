const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log('Total users in DB:', userCount);
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log('Users:', users);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
