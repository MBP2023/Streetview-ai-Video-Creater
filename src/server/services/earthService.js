import { Client } from '@googlemaps/google-maps-services-js';
import createError from 'http-errors';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const client = new Client({});

export const generateEarthTransition = async (lat, lng, options = {}) => {
  try {
    const {
      startAltitude = 50000, // meters
      endAltitude = 50, // meters
      steps = 20,
      tilt = 0,
      heading = 0
    } = options;

    // Calculate altitude steps for smooth transition
    const altitudeSteps = Array.from({ length: steps }, (_, i) => {
      const progress = i / (steps - 1);
      // Use exponential interpolation for smoother zoom effect
      return startAltitude * Math.pow(endAltitude / startAltitude, progress);
    });

    // Generate frames for the transition
    const frames = await Promise.all(altitudeSteps.map(async (altitude, index) => {
      const progress = index / (steps - 1);
      
      // Calculate current tilt (gradually increase tilt as we zoom in)
      const currentTilt = progress * tilt;
      
      try {
        const params = {
          center: { lat, lng },
          zoom: calculateZoomFromAltitude(altitude),
          size: '640x640',
          maptype: 'satellite',
          key: config.google.apiKey
        };

        const metadata = {
          altitude,
          tilt: currentTilt,
          heading,
          progress,
          timestamp: new Date().toISOString()
        };

        return {
          type: 'satellite',
          params,
          metadata
        };
      } catch (error) {
        logger.error('Error generating frame:', {
          error: error.message,
          altitude,
          index
        });
        throw error;
      }
    }));

    return {
      frames,
      metadata: {
        startLocation: { lat, lng },
        startAltitude,
        endAltitude,
        steps,
        tilt,
        heading
      }
    };
  } catch (error) {
    logger.error('Error generating Earth transition:', {
      error: error.message,
      coordinates: { lat, lng },
      stack: error.stack
    });

    if (error.response?.status === 403) {
      throw createError(403, 'API key invalid or quota exceeded');
    }

    throw error.status ? error : createError(500, 'Failed to generate Earth transition');
  }
};

// Helper function to calculate zoom level from altitude
const calculateZoomFromAltitude = (altitude) => {
  // Earth circumference at equator in meters
  const EARTH_CIRCUMFERENCE = 40075016.686;
  // Base resolution at zoom level 0 in meters/pixel
  const RESOLUTION_0 = EARTH_CIRCUMFERENCE / 256;
  
  // Calculate zoom level based on altitude
  const resolution = altitude * 2 * Math.PI / 256;
  const zoom = Math.log2(RESOLUTION_0 / resolution);
  
  return Math.max(0, Math.min(21, Math.floor(zoom)));
};