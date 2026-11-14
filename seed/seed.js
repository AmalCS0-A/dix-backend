import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

// Fills the database with the 52 shirts of the TP2 store.
// Run with:  npm run seed   (it replaces all existing products)
const products = JSON.parse(fs.readFileSync(new URL('./products.json', import.meta.url), 'utf8'));

try {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({});
  const inserted = await Product.insertMany(products);
  console.log(`Seed done: ${inserted.length} products inserted.`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
