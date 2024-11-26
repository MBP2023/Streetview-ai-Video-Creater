import { Client } from '@googlemaps/google-maps-services-js';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';

const client = new Client({});

export const findLocationByCID = async (cid) => {
  try {
    const response = await client.placeDetails({
      params: {
        place_id: cid,
        key: process.env.GOOGLE_MAPS_API_KEY,
        fields: ['name', 'formatted_address', 'geometry', 'url']
      }
    });

    if (response.data.status !== 'OK') {
      throw createError(404, 'Location not found');
    }

    const { result } = response.data;
    return {
      name: result.name,
      address: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      url: result.url
    };
  } catch (error) {
    logger.error('Error finding location by CID:', {
      error: error.message,
      cid,
      stack: error.stack
    });
    throw error;
  }
};

export const findLocationByQuery = async (query) => {
  try {
    const response = await client.findPlaceFromText({
      params: {
        input: query,
        inputtype: 'textquery',
        key: process.env.GOOGLE_MAPS_API_KEY,
        fields: ['place_id']
      }
    });

    if (response.data.status !== 'OK' || !response.data.candidates.length) {
      throw createError(404, 'Location not found');
    }

    const placeId = response.data.candidates[0].place_id;
    return findLocationByCID(placeId);
  } catch (error) {
    logger.error('Error finding location by query:', {
      error: error.message,
      query,
      stack: error.stack
    });
    throw error;
  }
};

export const extractCIDFromURL = (url) => {
  const patterns = [
    /[?&]cid=(\d+)/,                     // Maps URLs with CID parameter
    /maps\/place\/.*\/@.*,(\d+)/,        // Modern maps URLs
    /maps\?.*&ftid=(\d+)/,               // Legacy maps URLs
    /\?q=.*&storeid=(\d+)/               // Store specific URLs
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};