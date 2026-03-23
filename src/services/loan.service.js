const prisma = require('../config/db');

const applyForLoan = async (userId, data) => {
  const { amount, duration, interest = 10 } = data;
  return await prisma.loan.create({
    data: {
      userId,
      amount: Number(amount),
      duration: Number(duration),
      interest: Number(interest),
      status: 'PENDING'
    }
  });
};

const getLoansByUser = async (userId) => {
  return await prisma.loan.findMany({ where: { userId }, include: { payments: true } });
};

const getAllLoans = async () => {
  return await prisma.loan.findMany({ include: { user: true, payments: true } });
};

const approveLoan = async (loanId, adminFields = {}) => {
  const { agentPercentage = 0, lateFeePercentage = 0, graceDays = 0, agentId } = adminFields;

  // Fetch the current loan first so we have all fields
  const existingLoan = await prisma.loan.findUnique({ where: { id: Number(loanId) } });
  if (!existingLoan) throw new Error('Loan not found');

  const duration = existingLoan.duration || 1;
  const principal = Number(existingLoan.amount);
  const interestRate = Number(existingLoan.interest) / 100;

  // Monthly instalment = principal + monthly interest, divided evenly
  const monthlyInterest = principal * interestRate;
  const monthlyInstalment = parseFloat((monthlyInterest).toFixed(2)); // interest-only per month

  // Generate due dates: one per month starting from tomorrow
  const now = new Date();
  const firstDueDate = new Date(now);
  firstDueDate.setMonth(firstDueDate.getMonth() + 1);

  console.log(`[Service] Updating loan status to ACTIVE for ID: ${loanId}...`);
  // Update loan to ACTIVE and store admin fields
  const loan = await prisma.loan.update({
    where: { id: Number(loanId) },
    data: {
      status: 'ACTIVE',
      dueDate: firstDueDate,
      agentId: agentId ? Number(agentId) : null,
      agentPercentage: Number(agentPercentage),
      lateFeePercentage: Number(lateFeePercentage),
      graceDays: Number(graceDays)
    },
    include: { user: true }
  });
  console.log(`[Service] Loan ${loanId} state updated to ACTIVE.`);

  // We wrap the following in a separate try-catch to ensure the status update is NOT reversed
  // even if background tasks like notifications fail
  try {
     console.log(`[Service] Initiating background records for Loan ${loanId}...`);
     // Generate monthly payment installment records
     const paymentRecords = [];
     for (let i = 1; i <= duration; i++) {
       const installmentDue = new Date(now);
       installmentDue.setMonth(installmentDue.getMonth() + i);
       paymentRecords.push({
         loanId: loan.id,
         amount: monthlyInstalment,
         totalAmount: monthlyInstalment,
         status: 'PENDING',
         method: 'CASH',
       });
     }
     if (paymentRecords.length > 0) {
        await prisma.payment.createMany({ data: paymentRecords });
     }

     // Notify Borrower
     await prisma.notification.create({
       data: {
         userId: loan.userId,
         title: 'Loan Approved',
         message: `Your loan of K${principal.toLocaleString()} is ACTIVE. Monthly payment: K${monthlyInstalment.toLocaleString()}.`,
         type: 'SYSTEM'
       }
     });

     // Notify Agent if assigned
     if (loan.agentId) {
        await prisma.notification.create({
          data: {
            userId: loan.agentId,
            title: 'New Loan Assignment',
            message: `You are the agent for ${loan.user.name}'s loan.`,
            type: 'SYSTEM'
          }
        });
     }
  } catch (bgError) {
     console.error(`[Service] Background tasks for loan ${loanId} failed, but loan is ACTIVE:`, bgError.message);
  }

  return loan;
};

const rejectLoan = async (loanId) => {
  return await prisma.loan.update({
    where: { id: Number(loanId) },
    data: { status: 'REJECTED' }
  });
};

module.exports = { applyForLoan, getLoansByUser, getAllLoans, approveLoan, rejectLoan };
