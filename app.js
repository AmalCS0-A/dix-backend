import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS: allow the React dev server (Vite runs on 5173) to call this API from the browser.
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));

app.get('/', (req, res) => res.json({ name: 'DIX Maillots API', status: 'running' }));

app.use('/api', apiLimiter); // general rate limit on every /api route (before the body parser, so bad requests count too)
app.use(express.json()); // lets us read JSON bodies as req.body
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use(notFound); // must come after all the routes
app.use(errorHandler); // must be last

export default app;
