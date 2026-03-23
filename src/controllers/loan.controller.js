const loanService = require('../services/loan.service');

const applyLoan = async (req, res) => {
  try {
    const targetUserId = (req.user.role === 'ADMIN' || req.user.role === 'STAFF') ? (req.body.userId || req.user.id) : req.user.id;
    const loan = await loanService.applyForLoan(targetUserId, req.body);
    res.status(201).json({ success: true, message: 'Loan application submitted successfully', loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyLoans = async (req, res) => {
  try {
    const loans = await loanService.getLoansByUser(req.user.id);
    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLoans = async (req, res) => {
  try {
    if (req.user.role === 'ADMIN' || req.user.role === 'STAFF') {
      const loans = await loanService.getAllLoans();
      res.status(200).json({ success: true, count: loans.length, loans });
    } else {
      const loans = await loanService.getLoansByUser(req.user.id);
      res.status(200).json({ success: true, count: loans.length, loans });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentPercentage, lateFeePercentage, graceDays, agentId } = req.body;
    const loan = await loanService.approveLoan(id, { agentPercentage, lateFeePercentage, graceDays, agentId });
    res.status(200).json({ success: true, message: 'Loan approved', loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectLoan = async (req, res) => {
  try {
    const loan = await loanService.rejectLoan(req.params.id);
    res.status(200).json({ success: true, message: 'Loan rejected', loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { applyLoan, getMyLoans, getLoans, approveLoan, rejectLoan };
