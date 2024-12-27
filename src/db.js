const mongoose = require('mongoose');
const User = require('./utils/User');
require('dotenv').config(); 

mongoose
  .connect(process.env.DB_CONNECT)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

async function addUser(userId, firstName, userName = null) {
    User.syncIndexes()
    .then(() => console.log("Indexes synced"))
    .catch(err => console.error("Error syncing indexes:", err));
    try {
        if (!userId) {
            throw new Error('User ID cannot be null or undefined');
        }

        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            console.log(`Пользователь с ID ${userId} уже существует.`);
            return existingUser;
        }

        const newUser = new User({ userId, firstName, userName });
        await newUser.save();
        console.log(`Пользователь ${firstName} успешно добавлен.`);
        return newUser;
    } catch (error) {
        console.error('Ошибка при добавлении пользователя:', error);
        throw error;
    }
}

async function getUserById(userId) {
  try {
    const user = await User.findOne({ userId });
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

async function updateUserAddressAndBalance(userId, address, balance) {
  try {
    await User.updateOne({ userId }, { $set: { address, balance } });
    console.log(`User updated: ${userId}`);
  } catch (error) {
    console.error('Error updating user address and balance:', error);
  }
}

async function getAllUsers() {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

async function getUserByAddress(address) {
    try {
      if (!address) {
        console.log('Address is null or empty, skipping database lookup.');
        return null;
      }
  
      const user = await User.findOne({ address });
      return user;
    } catch (error) {
      console.error('Error fetching user by address:', error);
      return null;
    }
}

module.exports = {
  addUser,
  getUserById,
  updateUserAddressAndBalance,
  getAllUsers,
  getUserByAddress,
};