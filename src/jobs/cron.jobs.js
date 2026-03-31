const cron = require('node-cron');
const prisma = require('../config/db');
const { calculateLateFee } = require('../services/payment.service');
const { sendLoanReminders } = require('../services/reminder.service');

const start = () => {
  // 1. Calculate overdue and update penalties at 1:00 AM daily
  cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] Running daily penalty updates at 1:00 AM');
    try {
      const activeLoans = await prisma.loan.findMany({
        where: { status: 'ACTIVE' },
        include: {
          payments: { where: { status: { in: ['PENDING', 'LATE'] }, type: 'MONTHLY_INTEREST' } }
        }
      });

      for (const loan of activeLoans) {
        if (!loan.dueDate) continue;

        // Find the specific overdue payment for this due date
        // Actually, for simplicity, we update the first pending monthly interest payment
        const payment = loan.payments.length > 0 ? loan.payments[0] : null;
        if (!payment) continue;

        const { lateDays, penaltyAmount } = calculateLateFee(loan);

        if (lateDays > 0) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { 
              status: 'LATE', 
              lateDays, 
              penaltyAmount,
              totalCollected: Number(payment.baseAmount) + penaltyAmount + Number(payment.principalPaid)
            }
          });
          console.log(`[Cron] Loan ${loan.id} — Updated penalty: K${penaltyAmount} (${lateDays} days)`);
        }
      }
      console.log('[Cron] Penalty updates completed.');
    } catch (error) {
      console.error('[Cron Penalty Error]', error.message);
    }
  });

  // 2. Send SMS reminders at 8:00 AM daily
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily SMS reminders at 8:00 AM');
    try {
      await sendLoanReminders();
      console.log('[Cron] SMS reminders completed.');
    } catch (error) {
      console.error('[Cron Reminder Error]', error.message);
    }
  });
};

module.exports = { start };
