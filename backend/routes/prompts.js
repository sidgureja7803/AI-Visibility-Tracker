const express = require('express');
const router = express.Router();
const promptController = require('../controllers/promptController');

// Generate prompts for a category
router.post('/generate', promptController.generatePrompts);

// Query AI with prompts
router.post('/query', promptController.queryAI);

module.exports = router;

