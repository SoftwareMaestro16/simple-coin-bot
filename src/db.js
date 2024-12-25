const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve('./src/users.db');

const dbExists = fs.existsSync(dbPath);
const db = new Database(dbPath);

if (!dbExists) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      username TEXT,
      address TEXT DEFAULT NULL,
      balance REAL DEFAULT 0
    )
  `);
  console.log('База данных создана и инициализирована.');
} else {
  console.log('База данных уже существует.');
}

function addUser(id, name, username) {
  const stmt = db.prepare('INSERT OR IGNORE INTO users (id, name, username) VALUES (?, ?, ?)');
  stmt.run(id, name, username);
}

function getUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

function updateUserAddressAndBalance(id, address, balance) {
  const stmt = db.prepare('UPDATE users SET address = ?, balance = ? WHERE id = ?');
  stmt.run(address, balance, id);
}

function getAllUsers() {
    const stmt = db.prepare('SELECT * FROM users');
    return stmt.all(); 
}

function getUserByAddress(address) {
    const stmt = db.prepare('SELECT * FROM users WHERE address = ?');
    return stmt.get(address); 
}

module.exports = {
  addUser,
  getUserById,
  updateUserAddressAndBalance,
  getAllUsers,
  getUserByAddress
};