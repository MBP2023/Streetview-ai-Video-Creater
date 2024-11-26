import axios from 'axios';
import createError from 'http-errors';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const fetchLocationDetails = async (cid) => {
  try {
    if (!cid) {
      throw createError(400, 'CID is required');
    }

    const response = await axios.get(config.google.placesApiUrl, {
      params: {
        place_id: cid,
        key: config.google.apiKey,
        fields: [
          'name',
          'geometry',
          'formatted_address',
          'photos',
          'rating',
          'opening_hours',
          'types',
          'business_status'
        ].join(',')
      }
    });

    if (response.data.status !== 'OK') {
      throw createError(400, `Failed to fetch location details: ${response.data.status}`);
    }

    const { result } = response.data;
    
    return {
      name: result.name,
      address: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      photos: result.photos?.map(photo => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) || [],
      rating: result.rating,
      isOpen: result.opening_hours?.open_now,
      businessStatus: result.business_status,
      types: result.types,
      placeId: cid
    };
  } catch (error) {
    logger.error('Error fetching location details:', {
      error: error.message,
      cid,
      stack: error.stack
    });

    if (error.response?.status === 403) {
      throw createError(403, 'API key invalid or quota exceeded');
    }
    
    if (error.response?.status === 404) {
      throw createError(404, 'Location not found');
    }

    throw error.status ? error : createError(500, 'Failed to fetch location details');
  }
};

export const checkStreetViewAvailability = async (lat, lng) => {
  try {
    const response = await axios.get(config.google.streetViewMetadataUrl, {
      params: {
        location: `${lat},${lng}`,
        key: config.google.apiKey
      }
    });

    return {
      available: response.data.status === 'OK',
      date: response.data.date,
      copyright: response.data.copyright,
      location: response.data.location,
      panoId: response.data.pano_id
    };
  } catch (error) {
    logger.error('Error checking Street View availability:', {
      error: error.message,
      coordinates: { lat, lng },
      stack: error.stack
    });
    throw error.status ? error : createError(500, 'Failed to check Street View availability');
  }
};

export const fetchStreetViewImage = async (lat, lng, options = {}) => {
  try {
    // Check availability first
    const availability = await checkStreetViewAvailability(lat, lng);
    if (!availability.available) {
      throw createError(404, 'No Street View image available for this location');
    }

    const {
      size = '600x400',
      heading = 0,
      pitch = 0,
      fov = 90,
      quality = 95,
      returnMetadata = false
    } = options;

    const response = await axios.get(config.google.streetViewApiUrl, {
      params: {
        location: `${lat},${lng}`,
        size,
        heading,
        pitch,
        fov,
        quality,
        key: config.google.apiKey,
        return_error_code: true
      },
      responseType: 'arraybuffer',
      validateStatus: status => status < 400 || status === 404
    });

    if (response.status === 404) {
      throw createError(404, 'No Street View image available for this location');
    }

    if (returnMetadata) {
      return {
        image: response.data,
        metadata: availability
      };
    }

    return response.data;
  } catch (error) {
    logger.error('Error fetching Street View image:', {
      error: error.message,
      coordinates: { lat, lng },
      stack: error.stack
    });

    if (error.response?.status === 403) {
      throw createError(403, 'API key invalid or quota exceeded');
    }

    throw error.status ? error : createError(500, 'Failed to fetch Street View image');
  }
};