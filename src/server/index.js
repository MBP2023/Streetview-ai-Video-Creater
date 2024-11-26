import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import createError from 'http-errors';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { locationRoutes } from './routes/location.js';
import { streetViewRoutes } from './routes/streetview.js';
import { videoRoutes } from './routes/video.js';
import { earthRoutes } from './routes/earth.js';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

dotenv.config();

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Routes
app.use('/api/location', locationRoutes);
app.use('/api/streetview', streetViewRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/earth', earthRoutes);

// 404 handler
app.use((req, res, next) => {
  next(createError(404, 'Route not found'));
});

// Error handling
app.use(errorHandler);

app.listen(config.server.port, () => {
  logger.info(`Server running on port ${config.server.port} in ${config.server.env} mode`);
});