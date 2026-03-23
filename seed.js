const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lendanet.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@lendanet.com',
      phone: '0000000001',
      password,
      role: 'ADMIN',
      isVerified: true
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@lendanet.com' },
    update: {},
    create: {
      name: 'Global Node',
      email: 'staff@lendanet.com',
      phone: '0000000002',
      password,
      role: 'STAFF',
      isVerified: true
    }
  });

  const borrower = await prisma.user.upsert({
    where: { email: 'borrower@lendanet.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'borrower@lendanet.com',
      phone: '0000000003',
      password,
      role: 'BORROWER',
      isVerified: true
    }
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@lendanet.com' },
    update: {},
    create: {
      name: 'Alice Agent',
      email: 'agent@lendanet.com',
      phone: '0000000004',
      password,
      role: 'AGENT',
      isVerified: true
    }
  });

  // Verify if a loan exists
  const existingLoan = await prisma.loan.findFirst({ where: { userId: borrower.id } });
  
  if (!existingLoan) {
    const loan = await prisma.loan.create({
      data: {
          userId: borrower.id,
          amount: 50000,
          duration: 12,
          interest: 5,
          status: 'ACTIVE',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          agentId: agent.id,
          agentPercentage: 5
      }
    });
    
    await prisma.loan.create({
      data: {
          userId: borrower.id,
          amount: 15000,
          duration: 6,
          interest: 3,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Ensure Loan 1 has at least one verified payment for testing Archive
  const loan1 = await prisma.loan.findFirst({ where: { userId: borrower.id, status: 'ACTIVE' } });
  if (loan1) {
    const existingPayment = await prisma.payment.findFirst({ where: { loanId: loan1.id } });
    if (!existingPayment) {
       await prisma.payment.create({
         data: {
           loanId: loan1.id,
           amount: 8500,
           status: 'VERIFIED',
           method: 'WIRE',
           trxId: 'TX_SEED_999',
           paidAt: new Date(),
           totalAmount: 8500
         }
       });

       await prisma.commission.create({
         data: {
           agentId: agent.id,
           borrowerId: borrower.id,
           amount: (50000 * 0.05) * 0.05,
           percentage: 5
         }
       });
    }
  }

  console.log("Database seeded successfully with demo accounts! password: password123");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
