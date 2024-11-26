import dotenv from 'dotenv';
dotenv.config();

export const config = {
  google: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    placesApiUrl: 'https://maps.googleapis.com/maps/api/place/details/json',
    streetViewApiUrl: 'https://maps.googleapis.com/maps/api/streetview',
    streetViewMetadataUrl: 'https://maps.googleapis.com/maps/api/streetview/metadata',
    staticMapsUrl: 'https://maps.googleapis.com/maps/api/staticmap'
  },
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};