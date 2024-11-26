export const config = {
  google: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    placesApiUrl: 'https://maps.googleapis.com/maps/api/place/details/json',
    streetViewApiUrl: 'https://maps.googleapis.com/maps/api/streetview',
    streetViewMetadataUrl: 'https://maps.googleapis.com/maps/api/streetview/metadata',
    staticMapsUrl: 'https://maps.googleapis.com/maps/api/staticmap'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};