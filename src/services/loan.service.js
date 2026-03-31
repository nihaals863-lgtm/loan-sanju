const prisma = require('../config/db');
const settingsService = require('./settings.service');

const applyForLoan = async (userId, data) => {
  const { 
    amount, duration, interest,
    method, address, whatsapp, 
    bankName, accountNumber, accountName,
    description 
  } = data;
  const settings = await settingsService.getSettings();

  const loan = await prisma.loan.create({
    data: {
      userId,
      principalAmount: Number(amount),
      currentPrincipal: Number(amount),
      disbursementMethod: method,
      deliveryAddress: address,
      whatsapp,
      bankName,
      accountNumber,
      accountName,
      description,
      duration: Number(duration),
      // Set values from settings or fallback to hardcoded defaults
      initiationFeeRate: 0,
      initiationFee: 0,
      disbursedAmount: Number(amount),
      interestRate: interest ? Number(interest) : (settings.default_interest || 10),
      dueDay: 1,
      graceDays: settings.default_grace_days || 3,
      latePenaltyRate: settings.default_late_fee || 5,
      agentCommissionRate: settings.default_agent_percentage || 5,
      status: 'PENDING',
      monthlyPaymentCurrent: Number(amount) * ((interest ? Number(interest) : (settings.default_interest || 10)) / 100)
    }
  });
  console.log("[LOAN SERVICE] CREATED", loan.id);
  return loan;
};

const getLoansByUser = async (userId) => {
  return await prisma.loan.findMany({ where: { userId }, include: { payments: true, agent: true } });
};

const getAllLoans = async () => {
  return await prisma.loan.findMany({ include: { user: true, agent: true, payments: true } });
};

const setLoanTerms = async (loanId, terms) => {
  const settings = await settingsService.getSettings();

  const { 
    initiationFeeRate = 0, 
    interestRate = terms.interestRate ?? (settings.default_interest || 10), 
    dueDay = 1, 
    graceDays = terms.graceDays ?? (settings.default_grace_days || 3), 
    latePenaltyRate = terms.latePenaltyRate ?? (settings.default_late_fee || 5), 
    agentCommissionRate = terms.agentCommissionRate ?? (settings.default_agent_percentage || 5),
    agentId = null 
  } = terms;

  const loan = await prisma.loan.findUnique({ where: { id: Number(loanId) } });
  if (!loan) throw new Error('Loan not found');

  const principal = Number(loan.principalAmount);
  const feePercent = Number(initiationFeeRate || 0);
  const feeAmount = principal * (feePercent / 100);
  const disbursed = principal - feeAmount;

  const updatedLoan = await prisma.loan.update({
    where: { id: Number(loanId) },
    data: {
      initiationFeeRate: feePercent,
      initiationFee: feeAmount,
      disbursedAmount: disbursed,
      interestRate: Number(interestRate),
      dueDay: Number(dueDay || 5),
      graceDays: Number(graceDays),
      latePenaltyRate: Number(latePenaltyRate),
      agentCommissionRate: Number(agentCommissionRate),
      agentId: agentId ? Number(agentId) : null,
      status: 'TERMS_SET',
      monthlyPaymentCurrent: principal * (Number(interestRate) / 100)
    }
  });
  console.log("[LOAN SERVICE] TERMS UPDATED", updatedLoan.id);
  return updatedLoan;
};

const acceptLoanTerms = async (loanId) => {
  return await prisma.loan.update({
    where: { id: Number(loanId) },
    data: {
      borrowerAcceptedTerms: true,
      termsAcceptedAt: new Date(),
      status: 'TERMS_ACCEPTED'
    }
  });
};

const confirmLoanFunds = async (loanId) => {
  const loan = await prisma.loan.update({
    where: { id: Number(loanId) },
    data: {
      adminConfirmedFunds: true,
      fundsConfirmedAt: new Date(),
      status: 'ACTIVE'
    },
    include: { user: true }
  });

  // Calculate first due date based on dueDay
  const now = new Date();
  let firstDueDate = new Date(now.getFullYear(), now.getMonth() + 1, loan.dueDay);
  
  await prisma.loan.update({
    where: { id: loan.id },
    data: { dueDate: firstDueDate }
  });

  // Automatically generate the first monthly interest payment record (placeholder)
  const monthlyInterest = Number(loan.monthlyPaymentCurrent || (Number(loan.principalAmount) * (Number(loan.interestRate || 0) / 100)));
  if (monthlyInterest > 0) {
    await prisma.payment.create({
      data: {
        loanId: loan.id,
        type: 'MONTHLY_INTEREST',
        baseAmount: monthlyInterest,
        penaltyAmount: 0,
        principalPaid: 0,
        totalCollected: monthlyInterest,
        status: 'PENDING',
        dueDate: firstDueDate,
        method: loan.disbursementMethod || 'CASH'
      }
    });
  }

  // Notify Borrower (System Log)
  await prisma.notification.create({
    data: {
      userId: loan.userId,
      title: 'Funds Disbursed',
      message: `Your loan of K${Number(loan.principalAmount).toLocaleString()} is now ACTIVE. Disbursed: K${Number(loan.disbursedAmount).toLocaleString()}.`,
      type: 'SYSTEM'
    }
  });

  // Notify Borrower (Email Log)
  await prisma.notification.create({
    data: {
      userId: loan.userId,
      title: 'Funds Disbursed',
      message: `Your loan of K${Number(loan.principalAmount).toLocaleString()} is now ACTIVE. Disbursed: K${Number(loan.disbursedAmount).toLocaleString()}.`,
      type: 'EMAIL'
    }
  });

  // Notify Borrower (SMS Log)
  await prisma.notification.create({
    data: {
      userId: loan.userId,
      title: 'Funds Disbursed',
      message: `Your loan of K${Number(loan.principalAmount).toLocaleString()} is now ACTIVE. Disbursed: K${Number(loan.disbursedAmount).toLocaleString()}.`,
      type: 'SMS'
    }
  });

  console.log("[LOAN SERVICE] FUNDS CONFIRMED", loan.id);
  return loan;
};

const rejectLoan = async (loanId) => {
  return await prisma.loan.update({
    where: { id: Number(loanId) },
    data: { status: 'REJECTED' }
  });
};

const updateInterestRate = async (loanId, interestRate) => {
  return await prisma.loan.update({
    where: { id: Number(loanId) },
    data: { interestRate: Number(interestRate) }
  });
};

module.exports = { 
  applyForLoan, 
  getLoansByUser, 
  getAllLoans, 
  setLoanTerms, 
  acceptLoanTerms, 
  confirmLoanFunds, 
  rejectLoan,
  updateInterestRate
};
