const ScheduleController = require('../controllers/ScheduleController');
var router = require('express').Router();

router.get('/listing', ScheduleController.listing);

module.exports = router