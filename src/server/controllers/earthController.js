import { validationResult } from 'express-validator';
import createError from 'http-errors';
import { generateEarthTransition } from '../services/earthService.js';
import { logger } from '../utils/logger.js';

export const getEarthTransition = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, 'Invalid parameters');
    }

    const { coordinates } = req.params;
    const [lat, lng] = coordinates.split(',').map(Number);
    
    const options = {
      startAltitude: Number(req.query.startAltitude) || 50000,
      endAltitude: Number(req.query.endAltitude) || 50,
      steps: Number(req.query.steps) || 20,
      tilt: Number(req.query.tilt) || 45,
      heading: Number(req.query.heading) || 0
    };

    const transitionData = await generateEarthTransition(lat, lng, options);
    
    res.json({
      success: true,
      data: transitionData
    });
  } catch (error) {
    logger.error('Error in getEarthTransition:', error);
    next(error);
  }
};