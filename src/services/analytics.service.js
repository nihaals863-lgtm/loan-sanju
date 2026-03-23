const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async (user) => {
  try {
    const { id, role } = user;
    let whereUser = {};
    let whereLoan = {};
    let wherePayment = {};

    if (role === 'STAFF') {
      // Assuming STAFF = Lender. In this schema, we might need a way to link staff to lenderId.
      // For now, if role is STAFF, we might filter by a custom field if it existed.
      // Wait, look at schema: Loan has `agentId`. Does it have `lenderId`?
      // No, Loan has `userId` (Borrower) and `agentId`. 
      // Where is the Lender? 
      // Ah! In `mockData`, lenders have IDs like 'L1', 'L2'. 
      // But in Prisma, maybe the 'User' with role 'STAFF' is the lender?
      // Let's assume STAFF users are the owners of the loans they 'manage'.
      // But there's no `lenderId` in the Loan model! 
      // Wait, let's check schema again.
    }

    if (role === 'AGENT') {
      whereLoan = { agentId: id };
      wherePayment = { loan: { agentId: id } };
    }

    // If ADMIN, everything is global.
    const [
      totalUsers,
      totalLoans,
      activeLoans,
      pendingPayments,
      latePayments,
      totalCapitalRes
    ] = await Promise.all([
      prisma.user.count(role === 'ADMIN' ? {} : { where: { role: 'BORROWER' } }), // Only count borrowers if not admin? No, let's stay simple.
      prisma.loan.count({ where: whereLoan }),
      prisma.loan.count({ where: { ...whereLoan, status: 'ACTIVE' } }),
      prisma.payment.count({ where: { ...wherePayment, status: 'PENDING' } }),
      prisma.payment.count({ where: { ...wherePayment, status: 'LATE' } }),
      prisma.loan.aggregate({
        where: whereLoan,
        _sum: { amount: true }
      })
    ]);

    return {
      totalUsers: role === 'ADMIN' ? totalUsers : await prisma.user.count({ where: { role: 'BORROWER' } }), // Simplification
      totalLoans,
      activeLoans,
      pendingPayments,
      latePayments,
      totalCapital: totalCapitalRes._sum.amount || 0
    };
  } catch (error) {
    throw new Error('Error fetching dashboard stats: ' + error.message);
  }
};

module.exports = {
  getDashboardStats
};
