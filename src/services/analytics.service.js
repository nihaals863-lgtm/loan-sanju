const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async (user) => {
  const { id } = user;
  const role = user?.role?.toUpperCase();

  if (role === 'ADMIN' || role === 'LENDER' || role === 'STAFF') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalLoans,
      pendingLoans,
      activeLoans,
      overdueLoans,
      totalPrincipal,
      pendingPayments,
      verifiedPayments,
      totalCommissions,
      upcomingPaymentsCount,
      latePaymentsCount,
      paidTodayCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'BORROWER' } }),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: { in: ['PENDING', 'TERMS_SET', 'TERMS_ACCEPTED', 'FUNDS_CONFIRMED'] } } }),
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.count({ where: { status: 'LATE' } }),
      prisma.loan.aggregate({ _sum: { principalAmount: true } }),
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { totalCollected: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { baseAmount: true, penaltyAmount: true, principalPaid: true },
        _count: { id: true },
      }),
      prisma.commission.aggregate({ _sum: { amount: true } }),
      // Upcoming: PENDING payments due within next 7 days
      prisma.payment.count({
        where: { status: 'PENDING', dueDate: { gte: new Date(), lte: in7Days } },
      }),
      // Late payments
      prisma.payment.count({ where: { status: 'LATE' } }),
      // Verified today
      prisma.payment.count({
        where: { status: 'VERIFIED', paidAt: { gte: today } },
      }),
    ]);

    return {
      totalUsers,
      totalLoans,
      pendingLoans,
      activeLoans,
      overdueLoans,
      totalPrincipal: Number(totalPrincipal?._sum?.principalAmount || 0),
      totalRevenue: Number(verifiedPayments?._sum?.baseAmount || 0) + Number(verifiedPayments?._sum?.penaltyAmount || 0),
      totalInterest: Number(verifiedPayments?._sum?.baseAmount || 0),
      totalLateFees: Number(verifiedPayments?._sum?.penaltyAmount || 0),
      totalPrincipalPaid: Number(verifiedPayments?._sum?.principalPaid || 0),
      totalCommission: Number(totalCommissions?._sum?.amount || 0),
      netRevenue: (Number(verifiedPayments?._sum?.baseAmount || 0) + Number(verifiedPayments?._sum?.penaltyAmount || 0)) - Number(totalCommissions?._sum?.amount || 0),
      pendingPaymentsCount: pendingPayments?._count?.id || 0,
      pendingPaymentsAmount: Number(pendingPayments?._sum?.totalCollected || 0),
      verifiedPaymentsCount: verifiedPayments?._count?.id || 0,
      // New breakdown
      upcomingPaymentsCount,
      latePaymentsCount,
      paidTodayCount,
    };
  }

  if (role === 'BORROWER') {
    const activeLoan = await prisma.loan.findFirst({
      where: { userId: id, status: 'ACTIVE' },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } }
    });

    const totalPaidSum = activeLoan ? await prisma.payment.aggregate({
      where: { loanId: activeLoan.id, status: 'VERIFIED' },
      _sum: { totalCollected: true }
    }) : { _sum: { totalCollected: 0 } };

    return {
      activeLoan,
      totalPaid: Number(totalPaidSum?._sum?.totalCollected || 0)
    };
  }

  if (role === 'AGENT') {
    const [clientsCount, totalEarnings, commissions, activeLoans, pendingPayouts] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'BORROWER',
          OR: [
            { agentId: id },
            { loans: { some: { agentId: id } } },
          ],
        },
      }),
      prisma.commission.aggregate({ where: { agentId: id }, _sum: { amount: true } }),
      prisma.commission.findMany({
        where: { agentId: id },
        include: { borrower: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.loan.count({ where: { agentId: id, status: 'ACTIVE' } }),
      prisma.payout.aggregate({ where: { agentId: id, status: 'PENDING' }, _sum: { amount: true } })
    ]);

    return {
      clientsCount,
      totalEarnings: Number(totalEarnings?._sum?.amount || 0),
      recentCommissions: commissions,
      activeLoans,
      pendingPayout: Number(pendingPayouts?._sum?.amount || 0)
    };
  }

  return {};
};

module.exports = { getDashboardStats };
