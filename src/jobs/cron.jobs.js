const cron = require('node-cron');
const prisma = require('../config/db');
const { calculateLateFee } = require('../services/payment.service');
const { sendLoanReminders } = require('../services/reminder.service');

const start = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running daily tasks — Late Fees & SMS Reminders');

    try {
      // 1. Send SMS reminders (1 day before, on due date, 1 day after grace)
      await sendLoanReminders();

      // 2. Recalculate late fees for all PENDING/LATE payments
      const activeLoans = await prisma.loan.findMany({
        where: { status: 'ACTIVE' },
        include: {
          payments: { where: { status: { in: ['PENDING', 'LATE'] } } }
        }
      });

      for (const loan of activeLoans) {
        if (!loan.dueDate) continue;

        const payment = loan.payments.length > 0 ? loan.payments[0] : null;
        if (!payment) continue;

        // Use shared utility — same exact formula as submitPayment
        const { lateDays, lateAmount, totalAmount } = calculateLateFee(loan);

        if (lateDays > 0) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'LATE', lateDays, lateAmount, totalAmount }
          });
          console.log(`[Cron] Loan ${loan.id} — Late ${lateDays} days, Fee K${lateAmount}, Total K${totalAmount}`);
        }
      }

      console.log('[Cron] Daily tasks completed.');
    } catch (error) {
      console.error('[Cron Error]', error.message);
    }
  });
};

module.exports = { start };
