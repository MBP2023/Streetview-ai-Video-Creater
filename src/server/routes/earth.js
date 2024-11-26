import express from 'express';
import { param, query } from 'express-validator';
import { getEarthTransition } from '../controllers/earthController.js';

const router = express.Router();

const coordinatesValidator = param('coordinates')
  .matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
  .withMessage('Invalid coordinates format');

const optionalQueryValidators = [
  query('startAltitude')
    .optional()
    .isFloat({ min: 100, max: 100000 })
    .withMessage('Start altitude must be between 100 and 100000 meters'),
  query('endAltitude')
    .optional()
    .isFloat({ min: 50, max: 1000 })
    .withMessage('End altitude must be between 50 and 1000 meters'),
  query('steps')
    .optional()
    .isInt({ min: 5, max: 50 })
    .withMessage('Steps must be between 5 and 50'),
  query('tilt')
    .optional()
    .isFloat({ min: 0, max: 90 })
    .withMessage('Tilt must be between 0 and 90 degrees'),
  query('heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('Heading must be between 0 and 360 degrees')
];

router.get(
  '/:coordinates',
  [coordinatesValidator, ...optionalQueryValidators],
  getEarthTransition
);

export const earthRoutes = router;