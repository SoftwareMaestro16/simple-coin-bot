const mongoose = require('mongoose');
const User = require('./models/User');
const Collector = require('./models/Collector');
require('dotenv').config(); 

const dbConnect = process.env.DB_CONNECT;

mongoose.connect(dbConnect)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

async function updateUserAddressAndBalance(userId, address, balance, walletName = null) {
  try {
    const updateData = {
      address: address || null, 
      balance: balance || 0,  
      connectedWallet: walletName, 
    };

    await User.updateOne({ userId }, { $set: updateData });
    console.log(`User updated: ${userId} with wallet: ${walletName}`);
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

async function getCollector() {
  try {
    let collector = await Collector.findOne();
    if (!collector) {
      collector = new Collector(); 
      await collector.save();
    }
    return collector;
  } catch (error) {
    console.error('Error fetching collector data:', error);
    throw error;
  }
}

async function setCollectorAddress(address) {
  try {
    const collector = await getCollector();
    collector.collectorAddress = address;
    await collector.save();
    console.log('Collector address updated:', address);
  } catch (error) {
    console.error('Error setting collector address:', error);
    throw error;
  }
}

async function setMonthlyTokens(amount) {
  try {
    const collector = await getCollector();

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid monthly amount. It must be a positive number.');
    }

    collector.monthlyAmount = amount; 
    await collector.save();

    console.log(`Monthly tokens updated: ${amount}`);
  } catch (error) {
    console.error('Error updating monthly tokens:', error);
    throw error;
  }
}

async function setPaymentTrackingCode(userId, trackingCode) {
  return await User.findOneAndUpdate(
    { userId },
    { paymentTrackingCode: trackingCode },
    { new: true }
  );
}

async function activateSubscription(userId, durationMinutes) {
  if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
      console.error('Invalid durationMinutes:', durationMinutes); // Логируем ошибочное значение
      throw new Error('Invalid durationMinutes. It must be a positive number.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  if (isNaN(expiresAt.getTime())) {
      console.error('Invalid expiration date:', expiresAt); // Логируем некорректную дату
      throw new Error('Generated expiration date is invalid.');
  }

  console.log('Generated expiration date:', expiresAt);

  return await User.findOneAndUpdate(
      { userId },
      { paymentTrackingCode: null, subscriptionExpiresAt: expiresAt },
      { new: true }
  );
}

async function getUserById(userId) {
  return await User.findOne({ userId });
}

async function resetPaymentTrackingCode(userId) {
  return await User.findOneAndUpdate(
    { userId },
    { paymentTrackingCode: null },
    { new: true }
  );
}

module.exports = {
  addUser,
  getUserById,
  updateUserAddressAndBalance,
  getAllUsers,
  getUserByAddress,
  getCollector,
  setCollectorAddress,
  setMonthlyTokens,

  setPaymentTrackingCode,
  activateSubscription,
  getUserById,
  resetPaymentTrackingCode,
};