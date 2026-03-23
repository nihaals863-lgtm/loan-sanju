const { PrismaClient } = require('@prisma/client');
const { approveLoan, applyForLoan } = require('../src/services/loan.service');
const { verifyPayment, submitPayment } = require('../src/services/payment.service');

const prisma = new PrismaClient();

async function main() {
  const borrowerId = 3;
  const agentId = 4;

  console.log('--- Testing Loan Approval Notification ---');
  // Create a pending loan
  const loan = await applyForLoan(borrowerId, { amount: 1000, duration: 12, interest: 10 });
  console.log(`Created loan ID: ${loan.id}`);

  // Approve the loan and assign agent
  await approveLoan(loan.id, { agentId, agentPercentage: 5, lateFeePercentage: 2, graceDays: 3 });
  console.log('Loan approved and agent assigned.');

  // Check notifications for borrower and agent
  const borrowerNotifs = await prisma.notification.findMany({ where: { userId: borrowerId }, orderBy: { createdAt: 'desc' }, take: 1 });
  const agentNotifs = await prisma.notification.findMany({ where: { userId: agentId }, orderBy: { createdAt: 'desc' }, take: 1 });

  console.log('Borrower Notif:', borrowerNotifs[0]?.title, '-', borrowerNotifs[0]?.message);
  console.log('Agent Notif:', agentNotifs[0]?.title, '-', agentNotifs[0]?.message);

  console.log('\n--- Testing Payment Verification Notification ---');
  // Submit a payment
  const payment = await submitPayment(loan.id, 100, 'CASH', `TRX-${Date.now()}`);
  console.log(`Created payment ID: ${payment.id}`);

  // Verify the payment
  await verifyPayment(payment.id);
  console.log('Payment verified.');

  // Check notifications again
  const borrowerNotifs2 = await prisma.notification.findMany({ where: { userId: borrowerId }, orderBy: { createdAt: 'desc' }, take: 1 });
  const agentNotifs2 = await prisma.notification.findMany({ where: { userId: agentId }, orderBy: { createdAt: 'desc' }, take: 1 });

  console.log('Borrower Notif:', borrowerNotifs2[0]?.title, '-', borrowerNotifs2[0]?.message);
  console.log('Agent Notif:', agentNotifs2[0]?.title, '-', agentNotifs2[0]?.message);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
