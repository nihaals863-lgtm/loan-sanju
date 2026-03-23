const { approveLoan, getAllLoans } = require('./src/services/loan.service');
const prisma = require('./src/config/db');

async function test() {
  try {
    const loans = await getAllLoans();
    const pending = loans.find(l => l.status === 'PENDING');
    if (!pending) {
      console.log('No pending loans found to test.');
      return;
    }
    console.log(`Attempting to approve loan ID: ${pending.id} for user: ${pending.user.name}`);
    const updated = await approveLoan(pending.id, {
      agentPercentage: 5,
      lateFeePercentage: 2,
      graceDays: 3
    });
    console.log('Approval success!', updated.status);
  } catch (err) {
    console.error('Approval test failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
