import express from 'express';
import { param, query } from 'express-validator';
import { getStreetViewImage, checkAvailability } from '../controllers/streetViewController.js';

const router = express.Router();

const coordinatesValidator = param('coordinates')
  .matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
  .withMessage('Invalid coordinates format');

const optionalQueryValidators = [
  query('size').optional().matches(/^\d+x\d+$/).withMessage('Invalid size format'),
  query('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0 and 360'),
  query('pitch').optional().isFloat({ min: -90, max: 90 }).withMessage('Pitch must be between -90 and 90'),
  query('fov').optional().isFloat({ min: 10, max: 120 }).withMessage('FOV must be between 10 and 120'),
  query('quality').optional().isInt({ min: 0, max: 100 }).withMessage('Quality must be between 0 and 100'),
  query('metadata').optional().isBoolean().withMessage('Metadata must be a boolean')
];

router.get(
  '/check/:coordinates',
  [coordinatesValidator],
  checkAvailability
);

router.get(
  '/:coordinates',
  [coordinatesValidator, ...optionalQueryValidators],
  getStreetViewImage
);

export const streetViewRoutes = router;