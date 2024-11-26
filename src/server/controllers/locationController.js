import { validationResult } from 'express-validator';
import createError from 'http-errors';
import { findLocationByCID, findLocationByQuery, extractCIDFromURL } from '../services/locationService.js';
import { logger } from '../utils/logger.js';

export const findLocation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, { 
        message: 'Invalid input parameters',
        errors: errors.array()
      });
    }

    const { input } = req.body;
    let locationData;

    // Check if input is a URL
    if (input.includes('google.com/maps') || input.includes('goo.gl/maps')) {
      const cid = extractCIDFromURL(input);
      if (!cid) {
        throw createError(400, 'Could not extract location ID from URL. Please ensure you\'re using a valid Google Maps URL.');
      }
      locationData = await findLocationByCID(cid);
    } else {
      // Treat as location name
      locationData = await findLocationByQuery(input);
    }

    res.json({
      success: true,
      data: locationData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in findLocation:', {
      error: error.message,
      input: req.body.input,
      stack: error.stack
    });

    const statusCode = error.status || 500;
    const message = error.status === 404 
      ? 'Location not found. Please check the URL or try a different location.'
      : error.status === 403
      ? 'API quota exceeded. Please try again later.'
      : error.message || 'An unexpected error occurred';

    res.status(statusCode).json({
      success: false,
      error: {
        message,
        status: statusCode
      }
    });
  }
};