import { validationResult } from 'express-validator';
import createError from 'http-errors';
import { fetchStreetViewImage, checkStreetViewAvailability } from '../services/googleMapsService.js';
import { logger } from '../utils/logger.js';

export const checkAvailability = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, 'Invalid coordinates');
    }

    const { coordinates } = req.params;
    const [lat, lng] = coordinates.split(',').map(Number);
    
    const availability = await checkStreetViewAvailability(lat, lng);
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Error in checkAvailability:', error);
    next(error);
  }
};

export const getStreetViewImage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, 'Invalid parameters');
    }

    const { coordinates } = req.params;
    const [lat, lng] = coordinates.split(',').map(Number);
    
    const options = {
      size: req.query.size || '600x400',
      heading: Number(req.query.heading) || 0,
      pitch: Number(req.query.pitch) || 0,
      fov: Number(req.query.fov) || 90,
      quality: Number(req.query.quality) || 95,
      returnMetadata: req.query.metadata === 'true'
    };

    const response = await fetchStreetViewImage(lat, lng, options);
    
    if (options.returnMetadata) {
      res.json({
        success: true,
        data: {
          metadata: response.metadata,
          imageUrl: `data:image/jpeg;base64,${response.image.toString('base64')}`
        }
      });
    } else {
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000');
      res.send(response);
    }
  } catch (error) {
    logger.error('Error in getStreetViewImage:', error);
    next(error);
  }
};