const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
  console.log("[AUTH REGISTER REQUEST]", { ...req.body, password: '***' });
  try {
    const { name, email, phone, password, role, dob, address, documentUrl, nrc } = req.body;

    // Allow registering only strictly BORROWER or AGENT from public endpoint
    const allowedRoles = ['BORROWER', 'AGENT'];
    const userRole = allowedRoles.includes(role) ? role : 'BORROWER';

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      role: userRole,
      isVerified: false,
      isApproved: false,
      status: 'pending_approval'
    };
    if (dob) userData.dob = new Date(dob);
    if (address) userData.address = address;
    if (documentUrl) userData.documentUrl = documentUrl;
    if (nrc) userData.nrc = nrc;

    const user = await prisma.user.create({ data: userData });

    console.log("[AUTH REGISTER SUCCESS]", user.id);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: user.id, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error("[AUTH REGISTER ERROR]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerBorrower = async (req, res) => {
  req.body.role = 'BORROWER';
  return register(req, res);
};

const registerAgent = async (req, res) => {
  req.body.role = 'AGENT';
  return register(req, res);
};

const login = async (req, res) => {
  console.log("[AUTH LOGIN REQUEST]", { ...req.body, password: '***' });
  try {
    const { email, password } = req.body;
    
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is approved (Admin bypass)
    if (!user.isApproved && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    const token = generateToken(user.id, user.role);

    console.log("[AUTH LOGIN SUCCESS]", user.id);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error("[AUTH LOGIN ERROR]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, role: true, isVerified: true, isApproved: true, status: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role.toLowerCase() }
    });
  } catch (error) {
    console.error("[AUTH ME ERROR]", error.message);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { register, login, registerBorrower, registerAgent, getMe };
