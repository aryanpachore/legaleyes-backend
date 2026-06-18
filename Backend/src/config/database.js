import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config();

// Determine SSL configurations dynamically
const getSSLConfig = () => {
  const caCertPath = path.resolve('./ca.pem');
  
  // If you downloaded ca.pem from Aiven and placed it in your root folder
  if (fs.existsSync(caCertPath)) {
    console.log('🔒 Found ca.pem! Connecting to Aiven with explicit CA validation.');
    return {
      rejectUnauthorized: true,
      ca: fs.readFileSync(caCertPath).toString()
    };
  }
  
  // Fallback configuration if ca.pem isn't downloaded yet
  return {
    rejectUnauthorized: false
  };
};

// Initialize Sequelize with custom Port and dynamic SSL support
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 25419,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      ssl: getSSLConfig() // 👈 Dynamically loads certificate rules
    }
  }
);

// Connection Function
export const connectDB = async () => {
  try {
    // Print out diagnostics right before hitting the network
    console.log(`📡 Attempting to reach database host: ${process.env.DB_HOST} on Port: ${process.env.DB_PORT || 25419}...`);
    
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    
    // Provide a helpful hint if a timeout occurs
    if (error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 HINT: Your current internet connection/Wi-Fi is likely blocking port 25419. Try switching to a Mobile Hotspot and setting your Aiven IP Filter to 0.0.0.0/0.\n');
    }
    
    process.exit(1); // Exit process with failure
  }
};