const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { auth, checkRole } = require('../middleware/auth');

// PUBLIC ROUTES
router.get('/', galleryController.getImages); // Get all public images with filters
router.get('/filters', galleryController.getFilters); // Get categories and tags for filtering
router.get('/tags', galleryController.getUniqueTags); // Get all unique tags

// ADMIN ROUTES (specific routes before dynamic routes)
router.get('/all', auth, checkRole('admin'), galleryController.getAllImages); // Get all images for admin panel
router.post('/', auth, checkRole('admin'), galleryController.uploadImage); // Upload a new image
router.put('/:id', auth, checkRole('admin'), galleryController.updateImage); // Update image details
router.delete('/:id', auth, checkRole('admin'), galleryController.deleteImage); // Delete an image

// Dynamic routes (must be last)
router.get('/:id', galleryController.getImage); // Get a single image by ID

module.exports = router;
