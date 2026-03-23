const paymentService = require('../services/payment.service');

const createPayment = async (req, res) => {
  try {
    const { loanId, amount, method, trxId } = req.body;
    const payment = await paymentService.submitPayment(loanId, amount, method, trxId);
    res.status(201).json({ success: true, message: 'Payment submitted for verification', payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const payment = await paymentService.verifyPayment(req.params.id);
    res.status(200).json({ success: true, message: 'Payment verified', payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    if (req.user.role === 'ADMIN' || req.user.role === 'STAFF') {
        const payments = await paymentService.getAllPayments();
        res.status(200).json({ success: true, count: payments.length, payments });
    } else {
        const payments = await paymentService.getPaymentsByUser(req.user.id);
        res.status(200).json({ success: true, count: payments.length, payments });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPayment, verifyPayment, getPayments };
