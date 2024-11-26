import express from 'express';
import { body } from 'express-validator';
import { renderVideo } from '../controllers/videoController.js';

const router = express.Router();

router.post(
  '/render',
  [
    body('timeline')
      .isArray()
      .withMessage('Timeline must be an array')
      .notEmpty()
      .withMessage('Timeline cannot be empty')
  ],
  renderVideo
);

export const videoRoutes = router;