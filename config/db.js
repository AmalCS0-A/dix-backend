import mongoose from 'mongoose';

// Opens the connection to MongoDB (Atlas or local). The address comes from .env.
export default async function connectDB() {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${conn.connection.host} / database "${conn.connection.name}"`);
}
