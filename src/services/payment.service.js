const prisma = require('../config/db');

// ─────────────────────────────────────────
// calculateLateFee(loan, payment)
// Returns: { lateDays, lateAmount, totalAmount }
// ─────────────────────────────────────────
const calculateLateFee = (loan) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const dueDate = new Date(loan.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const graceDays = loan.graceDays || 0;
  const graceDeadline = new Date(dueDate);
  graceDeadline.setDate(graceDeadline.getDate() + graceDays);

  const monthlyInterest = loan.amount * (loan.interest / 100);

  if (currentDate > graceDeadline) {
    const diffTime = currentDate.getTime() - graceDeadline.getTime();
    const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const lateFeeMonthly = monthlyInterest * ((loan.lateFeePercentage || 0) / 100);
    const perDayLate = lateFeeMonthly / 30;
    const lateAmount = parseFloat((perDayLate * lateDays).toFixed(2));
    const totalAmount = parseFloat((monthlyInterest + lateAmount).toFixed(2));

    return { lateDays, lateAmount, totalAmount };
  }

  // Within grace period — no late fee
  return { lateDays: 0, lateAmount: 0, totalAmount: parseFloat(monthlyInterest.toFixed(2)) };
};

const submitPayment = async (loanId, amount, method, trxId) => {
  // Fetch loan to calculate any late fees at submission time
  const loan = await prisma.loan.findUnique({ where: { id: Number(loanId) } });

  let lateFeeData = { lateDays: 0, lateAmount: 0, totalAmount: amount };
  if (loan && loan.dueDate) {
    lateFeeData = calculateLateFee(loan);
  }

  const payment = await prisma.payment.create({
    data: {
      loanId: Number(loanId),
      amount: Number(amount),
      method,
      trxId,
      status: 'PENDING',
      lateDays: lateFeeData.lateDays,
      lateAmount: lateFeeData.lateAmount,
      totalAmount: lateFeeData.totalAmount,
      paidAt: null
    }
  });
  return payment;
};

const verifyPayment = async (paymentId) => {
  const payment = await prisma.payment.update({
    where: { id: Number(paymentId) },
    data: { status: 'VERIFIED', paidAt: new Date() },
    include: { loan: { include: { user: true } } }
  });

  // Notify Borrower
  await prisma.notification.create({
    data: {
      userId: payment.loan.userId,
      title: 'Payment Verified',
      message: `Your payment of K${payment.amount.toLocaleString()} for loan ID #${payment.loanId} has been verified and processed.`,
      type: 'SYSTEM'
    }
  });

  if (payment.loan.agentId && payment.loan.agentPercentage > 0) {
    // commission = monthlyInterest * agentPercentage
    const monthlyInterest = payment.loan.amount * (payment.loan.interest / 100);
    const commissionAmount = monthlyInterest * (payment.loan.agentPercentage / 100);

    await prisma.commission.create({
      data: {
        agentId: payment.loan.agentId,
        borrowerId: payment.loan.userId,
        amount: commissionAmount,
        percentage: payment.loan.agentPercentage
      }
    });

    // Notify Agent
    await prisma.notification.create({
      data: {
        userId: payment.loan.agentId,
        title: 'Commission Earned',
        message: `You earned a commission of K${commissionAmount.toLocaleString()} from ${payment.loan.user.name}'s payment.`,
        type: 'SYSTEM'
      }
    });
  }

  return payment;
};

const getAllPayments = async () => {
  return await prisma.payment.findMany({
    include: { loan: { include: { user: true } } }
  });
};

const getPaymentsByUser = async (userId) => {
  return await prisma.payment.findMany({
    where: { loan: { userId } },
    include: { loan: true }
  });
};

module.exports = { submitPayment, verifyPayment, getAllPayments, getPaymentsByUser, calculateLateFee };

