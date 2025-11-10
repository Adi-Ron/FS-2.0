const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../utils/authMiddleware');
const { importStudents, importFacultiesAndSubjects } = require('../utils/importData');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get sheet names from Excel file
router.post('/sheets', auth('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { getSheetNames } = require('../utils/importData');
    const sheetNames = getSheetNames(req.file.path);
    
    // Don't delete file here - it will be used for import
    // File will be cleaned up after import or by a cleanup job

    res.json({ sheetNames, filePath: req.file.path });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error reading sheets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import students
router.post('/students', auth('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { batch, course, sheetName } = req.body;
    
    if (!batch || !course) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Batch and course are required' });
    }

    const result = await importStudents(req.file.path, batch, course, sheetName);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (result.success) {
      res.json({
        message: 'Students imported successfully',
        ...result
      });
    } else {
      res.status(500).json({
        message: 'Error importing students',
        error: result.error
      });
    }
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error importing students:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import faculties and subjects
router.post('/faculties-subjects', auth('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { batch, course, sheetName } = req.body;
    
    if (!batch || !course) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Batch and course are required' });
    }

    const result = await importFacultiesAndSubjects(req.file.path, batch, course, sheetName);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (result.success) {
      res.json({
        message: 'Faculties and subjects imported successfully',
        ...result
      });
    } else {
      res.status(500).json({
        message: 'Error importing faculties and subjects',
        error: result.error
      });
    }
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error importing faculties and subjects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

