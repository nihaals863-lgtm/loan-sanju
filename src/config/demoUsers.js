/**
 * Demo users for Quick Access + ensureDemoUsers / seed.
 * Phones are dummy placeholders (999100000x) — avoid clashes with real signups.
 * Emails are filled from DB after GET /api/auth/demo-credentials/:role
 * demoPlainPassword: optional; defaults to password123 (admin/staff).
 */
const DEMO_USERS = [
  { name: 'System Admin', email: 'admin@lendanet.com', phone: '9991000001', role: 'ADMIN' },
  { name: 'Staff User', email: 'staff@lendanet.com', phone: '9991000002', role: 'STAFF' },
  { name: 'Agent User', email: 'demoagent@gmail.com', phone: '9991000003', role: 'AGENT', demoPlainPassword: '123456' },
  { name: 'Borrower User', email: 'demo@gmail.com', phone: '9991000004', role: 'BORROWER', demoPlainPassword: '123456' },
];

module.exports = { DEMO_USERS };
