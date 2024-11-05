const paymentsController = require("../controllers/PaymentsController");
const router = require('express').Router();
const express = require('express');


router.post('/webhook', express.json({type: 'application/json'}), paymentsController.webhookHandler);
router.get('/checkPaymentStatus', paymentsController.checkPaymentStatus);
router.get('/listing', paymentsController.paymentListing);
router.delete('/delete', paymentsController.paymentDelete);

module.exports = router;