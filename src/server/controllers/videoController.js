import { validationResult } from 'express-validator';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';

export const renderVideo = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, 'Invalid timeline data');
    }

    const { timeline } = req.body;
    
    // Since we can't use FFmpeg in WebContainer, we'll return the processed frames
    // that the frontend can use to create a video using Web APIs
    const processedFrames = timeline.map(frame => ({
      ...frame,
      processed: true
    }));

    res.json({
      success: true,
      data: processedFrames
    });
  } catch (error) {
    logger.error('Error in renderVideo:', error);
    next(error);
  }
};