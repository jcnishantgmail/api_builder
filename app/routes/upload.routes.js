const express = require('express');
const path = require('path');
const router = express.Router();
/**Image upload using multer */
var multer = require('multer');
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/img');
  },
  filename: (req, file, cb) => {
    // console.log(file);
    var filetype = '';
    if (file.mimetype === 'image/gif') {
      filetype = 'gif';
    }
    if (file.mimetype === 'image/png') {
      filetype = 'png';
    }
    if (file.mimetype === 'image/jpeg') {
      filetype = 'jpg';
    }
    const randomSuffix = Math.floor(Math.random() * 10000);

    cb(null, 'image-' + Date.now() + '-' + randomSuffix + '.' + filetype);
  },
});
var upload = multer({ storage: storage });

var fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/document');
  },
  filename: (req, file, cb) => {
    console.log(file);
    var ext = file.mimetype.split("/")[1]

    cb(null, 'document-' + Date.now() + `.${ext}`);
  },
});
var uploadJson = multer({ storage: fileStorage });

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/videos');
  },
  filename: (req, file, cb) => {
    var ext = file.originalname.split('.').pop(); // Get the file extension from original filename

    cb(null, 'video-' + Date.now() + `.${ext}`);
  },
});

const uploadVideo = multer({ storage: videoStorage });

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/audios');
  },
  filename: (req, file, cb) => {
    var ext = file.originalname.split('.').pop(); // Get the file extension from original filename

    cb(null, 'audio-' + Date.now() + `.${ext}`);
  },
});

const uploadAudio = multer({ storage: audioStorage });


// module.exports = (app) => {
// var router = require('express').Router();

router.post('/image', upload.single('file'), function (req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please upload a valid file.' },
      });
    }
    return res.json({
      success: true,
      filePath: 'img/' + req.file.filename,
      fileName: req.file.filename,
    });
  } catch (error) {

    return res.status(400).json({
      success: false,
      error: { code: 400, message: error },
    });

  }
});

router.post(
  '/document',
  uploadJson.single('file'),
  function (req, res, next) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please upload a valid document file.' },
      });
    }
    return res.json({
      success: true,
      filePath: 'document/' + req.file.filename,
      fileName: req.file.filename,
    });
  }
);
router.post(
  '/multiple-images',
  upload.array('files'), // 'file' is the field name for multiple file
  function (req, res, next) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Please upload at least one valid file.' },
      });
    }
    const fileDetails = req.files.map(files => ({
      filePath: 'img/' + files.filename,
      fileName: files.filename,
    }));

    return res.json({
      success: true,
      files: fileDetails,
    });
  }
);
router.post(
  '/video', uploadVideo.single('file'), function (req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Please upload a valid file.' },
        });
      }
      return res.json({
        success: true,
        filePath: 'videos/' + req.file.filename,
        fileName: req.file.filename,
      });
    } catch (error) {

      return res.status(400).json({
        success: false,
        error: { code: 400, message: error },
      });

    }
  }
);
router.post(
  '/audio', uploadAudio.single('file'), function (req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Please upload a valid file.' },
        });
      }
      return res.json({
        success: true,
        filePath: 'audios/' + req.file.filename,
        fileName: req.file.filename,
      });
    } catch (error) {

      return res.status(400).json({
        success: false,
        error: { code: 400, message: error },
      });

    }
  }
);
module.exports = router

