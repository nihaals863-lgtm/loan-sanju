const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true, email: true }
  });
  console.log('All Users:', allUsers);

  const loans = await prisma.loan.findMany({
    include: { user: true, agent: true }
  });
  console.log('Loans:', JSON.stringify(loans.map(l => ({
    id: l.id,
    amount: l.amount,
    borrower: l.user.name,
    agent: l.agent ? l.agent.name : 'NONE',
    agentId: l.agentId
  })), null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
