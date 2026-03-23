const prisma = require('../config/db');
const { hashPassword } = require('../utils/bcrypt');

/**
 * Get users with optional role and search filtering
 */
const getUsers = async (role, search) => {
  const where = {};
  if (role && role !== 'ALL') {
    where.role = role;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } }
    ];
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      risk: true,
      businessName: true,
      nrc: true,
      dob: true,
      address: true,
      documentUrl: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

const createUser = async (userData) => {
  const { name, email, phone, password, role, businessName, nrc, dob, address, documentUrl, risk } = userData;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }, { ...(nrc ? { nrc } : {}) }] }
  });

  if (existingUser) {
    throw new Error('User with this email, phone, or NRC already exists');
  }

  const hashedPassword = await hashPassword(password);

  return await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'BORROWER',
      isVerified: true,
      risk: risk || 'GREEN',
      businessName,
      nrc,
      dob: dob ? new Date(dob) : null,
      address,
      documentUrl
    }
  });
};

const updateUser = async (id, data) => {
  const updateData = { ...data };
  
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }
  
  if (updateData.dob) {
    updateData.dob = new Date(updateData.dob);
  }

  return await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData
  });
};

const verifyUser = async (id, isVerified = true) => {
  return await prisma.user.update({
    where: { id: parseInt(id) },
    data: { isVerified }
  });
};

const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: { id: parseInt(id) }
  });
};

const getAgentClients = async (agentId) => {
  return await prisma.user.findMany({
    where: {
      loans: {
        some: {
          agentId: parseInt(agentId)
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      risk: true,
      createdAt: true,
      loans: {
        where: { agentId: parseInt(agentId) },
        select: {
          id: true,
          amount: true,
          status: true,
          interest: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  verifyUser,
  deleteUser,
  getAgentClients
};
