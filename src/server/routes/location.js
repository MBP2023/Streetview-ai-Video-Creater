import express from 'express';
import { body } from 'express-validator';
import { findLocation } from '../controllers/locationController.js';

const router = express.Router();

router.post(
  '/find',
  [
    body('input')
      .notEmpty()
      .withMessage('Input is required')
      .isString()
      .withMessage('Input must be a string')
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage('Input must be between 3 and 1000 characters')
  ],
  findLocation
);

export const locationRoutes = router;