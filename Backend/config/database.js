const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'markle',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
// Only add password if it's set in env
if (process.env.DB_PASSWORD) {
  config.password = process.env.DB_PASSWORD;
}

const pool = mysql.createPool(config);

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
}; 