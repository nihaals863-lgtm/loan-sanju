const prisma = require('../config/db');
const { sendSMS } = require('../utils/sms');

// Called by cron daily — sends reminders based on how many days until/after due date
const sendLoanReminders = async () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activeLoans = await prisma.loan.findMany({
    where: { status: 'ACTIVE' },
    include: { user: true }
  });

  for (const loan of activeLoans) {
    if (!loan.dueDate || !loan.user?.phone) continue;

    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // negative = before due

    const phone = loan.user.phone;
    const amount = `K${Number(loan.amount).toLocaleString()}`;

    if (diffDays === -1) {
      // 1 day BEFORE due date
      const msg = `⏰ Reminder: Your loan payment of ${amount} is due TOMORROW. Pay on time to avoid late fees.`;
      const success = await sendSMS(phone, msg);
      await prisma.notification.create({
        data: { userId: loan.userId, title: 'Loan Reminder (1 Day Before)', message: msg, type: 'SMS', status: success ? 'SENT' : 'FAILED' }
      });
    } else if (diffDays === 0) {
      // On due date
      const msg = `📅 Today is your payment due date. Please pay ${amount} now to avoid penalties.`;
      const success = await sendSMS(phone, msg);
      await prisma.notification.create({
        data: { userId: loan.userId, title: 'Loan Due Reminder', message: msg, type: 'SMS', status: success ? 'SENT' : 'FAILED' }
      });
    } else if (diffDays === (loan.graceDays || 0) + 1) {
      // 1 day after grace period ends
      const msg = `🚨 LATE ALERT: Your loan payment of ${amount} is now overdue. Late fees are being applied daily.`;
      const success = await sendSMS(phone, msg);
      await prisma.notification.create({
        data: { userId: loan.userId, title: 'Late Payment Alert', message: msg, type: 'SMS', status: success ? 'SENT' : 'FAILED' }
      });
    }
  }

  console.log(`[Reminder] Processed ${activeLoans.length} active loans`);
};

module.exports = { sendLoanReminders };
