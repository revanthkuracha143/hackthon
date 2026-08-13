const express = require('express');
const multer = require('multer');
const ProjectController = require('../controllers/projectController');

const router = express.Router();
const upload = multer({
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit for projects containing node_modules or assets
});

// Upload wrapper middleware to handle Multer errors gracefully
const handleUpload = (req, res, next) => {
  upload.single('project')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: `File upload error: ${err.message}`,
        code: err.code
      });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
};

router.post('/upload', handleUpload, ProjectController.uploadZip);
router.post('/demo', ProjectController.loadDemo);
router.post('/:id/analyze', ProjectController.analyzeProject);
router.post('/:id/test', ProjectController.testProject);
router.post('/:id/diagnose', ProjectController.diagnoseProject);
router.post('/:id/apply-fix', ProjectController.applyFix);
router.post('/:id/verify', ProjectController.verifyFix);
router.get('/:id/status', ProjectController.getStatus);

module.exports = router;
