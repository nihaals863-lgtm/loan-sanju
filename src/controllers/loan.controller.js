const loanService = require('../services/loan.service');

const applyLoan = async (req, res) => {
  console.log("[LOAN APPLY REQUEST]", req.user.id, req.body);
  try {
    const targetUserId = (req.user.role === 'ADMIN' || req.user.role === 'STAFF') ? (req.body.userId || req.user.id) : req.user.id;
    const loan = await loanService.applyForLoan(targetUserId, req.body);
    console.log("[LOAN APPLY SUCCESS]", loan.id);
    res.status(201).json({ success: true, message: 'Loan application submitted successfully', loan });
  } catch (error) {
    console.error("[LOAN APPLY ERROR]", error.message);
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

const setTerms = async (req, res) => {
  console.log("[LOAN SET_TERMS REQUEST]", req.params.id, req.body);
  try {
    const { id } = req.params;
    const loan = await loanService.setLoanTerms(id, req.body);
    console.log("[LOAN SET_TERMS SUCCESS]", loan.id);
    res.status(200).json({ success: true, message: 'Loan terms set. Awaiting borrower acceptance.', loan });
  } catch (error) {
    console.error("[LOAN SET_TERMS ERROR]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptTerms = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await loanService.acceptLoanTerms(id);
    res.status(200).json({ success: true, message: 'Terms accepted. Awaiting fund confirmation.', loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmFunds = async (req, res) => {
  console.log("[LOAN CONFIRM_FUNDS REQUEST]", req.params.id);
  try {
    const { id } = req.params;
    const loan = await loanService.confirmLoanFunds(id);
    console.log("[LOAN CONFIRM_FUNDS SUCCESS]", loan.id);
    res.status(200).json({ success: true, message: 'Funds confirmed. Loan is now ACTIVE.', loan });
  } catch (error) {
    console.error("[LOAN CONFIRM_FUNDS ERROR]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectLoan = async (req, res) => {
  console.log("[LOAN REJECT REQUEST]", req.params.id);
  try {
    const loan = await loanService.rejectLoan(req.params.id);
    console.log("[LOAN REJECT SUCCESS]", loan.id);
    res.status(200).json({ success: true, message: 'Loan rejected', loan });
  } catch (error) {
    console.error("[LOAN REJECT ERROR]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { interestRate } = req.body;
    if (interestRate === undefined || interestRate === null) {
      return res.status(400).json({ success: false, message: 'interestRate is required' });
    }
    const loan = await loanService.updateInterestRate(id, interestRate);
    res.status(200).json({ success: true, message: 'Interest rate updated successfully.', loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  applyLoan, 
  getMyLoans, 
  getLoans, 
  setTerms, 
  acceptTerms, 
  confirmFunds, 
  rejectLoan,
  updateInterest
};
