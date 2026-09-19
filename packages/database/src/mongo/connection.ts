import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_URI = 'mongodb+srv://lenguyenanhmai05_db_user:uWN5qIGg7DrclhIz@cluster0.lxovslt.mongodb.net/aita_intelligent?retryWrites=true&w=majority';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;

let isConnected = false;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: 'aita_intelligent',
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB Atlas] ✅ Connected to Cloud Database: ${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.warn(`[MongoDB Atlas] ⚠️ Connection warning: ${error.message}`);
    throw error;
  }
}

export { mongoose };
