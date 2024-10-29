const paymentsController = require("../controllers/PaymentsController");
const router = require('express').Router();
const express = require('express');


router.post('/webhook', express.json({type: 'application/json'}), paymentsController.webhookHandler);


module.exports = router;