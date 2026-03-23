const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.loan.updateMany({
    where: { id: { in: [1, 8] } },
    data: { agentId: 4 }
  });
  console.log('Updated loans with Agent #4:', result);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
