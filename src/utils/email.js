// Mock Email Service
const sendEmail = async (email, subject, text) => {
  console.log(`[Email Sent] To: ${email} | Subject: ${subject}`);
  return true;
};

module.exports = { sendEmail };
