import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { HttpError } from '../middleware/errorHandler.js';

// Only these fields can be written by a client (the rest of the body is ignored).
const FIELDS = [
  'name', 'description', 'price', 'category', 'imageUrl', 'stock',
  'kit', 'season', 'league', 'country', 'oldPrice',
];
const pick = (body = {}) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// Rejects ids that are not valid MongoDB ObjectIds (400) before querying.
function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `Invalid product ID: "${id}"`);
}

// GET /api/products
export async function getProducts(req, res) {
  const products = await Product.find().sort({ _id: 1 });
  res.status(200).json(products);
}

// GET /api/products/:id
export async function getProduct(req, res) {
  checkId(req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.status(200).json(product);
}

// POST /api/products   (JWT required)
export async function createProduct(req, res) {
  const product = await Product.create(pick(req.body)); // schema validation runs here
  res.status(201).json(product);
}

// PUT /api/products/:id   (JWT required)
export async function updateProduct(req, res) {
  checkId(req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  product.set(pick(req.body));
  await product.save(); // validates the final product
  res.status(200).json(product);
}

// DELETE /api/products/:id   (JWT required)
export async function deleteProduct(req, res) {
  checkId(req.params.id);
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.status(200).json({ message: 'Product deleted', product });
}
