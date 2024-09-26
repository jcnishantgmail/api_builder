const db = require("../models");
const mongoose = require("mongoose");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const checkoutSessionHandler = async function (req, res) {
    try {
            let { invoiceId } = req.body;
            const invoice = await db.invoices.findById(invoiceId);
            const jobId = invoice["jobId"].toString();
            let amount = invoice["total"];
            amount = amount * 100;
            amount = Math.ceil(amount); //just to convert to integer - number of pennies
            const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',    
                        product_data: {
                            name: invoice["invoiceNumber"],
                        },
                        unit_amount: amount
                    },
                    quantity: 1
                }
            ],
            payment_intent_data: {
                metadata: {
                    jobId: jobId,
                    invoiceId: invoiceId
                }
            },
            mode: 'payment',
            success_url: process.env.FRONT_WEB_URL,
            cancel_url: process.env.FRONT_WEB_URL
        });    

        return res.json({id: session.id, session});
    } catch(err) {
        console.log(err);
        return res.status(500).json({message: err.message});
    }
};

const updateDatabaseWithPaymentStatus = async function(paymentIntent, status) {
    if(status === 'succeeded') {
        const paymentDoc = await db.payments.create({id: paymentIntent.id, invoiceId: mongoose.Types.ObjectId.createFromHexString(paymentIntent.metadata.invoiceId),
            txnDatetime: new Date(),
            paymentType: "stripe",
            status: "successful"});
        console.log(paymentDoc);
        const updatedInvoice = await db.invoices.updateOne({ _id:mongoose.Types.ObjectId.createFromHexString(paymentIntent.metadata.invoiceId)}, {paidDate: paymentDoc["createdAt"], paymentType: 'stripe', paymentId: paymentDoc["id"], status: "completed" });
        const updatedJob = await db.jobs.updateOne({_id: mongoose.Types.ObjectId.createFromHexString(paymentIntent.metadata.jobId)}, {invoiceStatus: "Completed"});
        return paymentIntent;
    }
    else if(status === 'failed') {
        const paymentDoc = await db.payments.create({id: paymentIntent.id, invoiceId: mongoose.Types.ObjectId.createFromHexString(paymentIntent.metadata.invoiceId),
            txnDatetime: new Date(),
            paymentType: "stripe",
            status: "failed"});
        
        return paymentIntent;
    }
    else return paymentIntent;
};

const handlePaymentIntentSucceeded = async function(paymentIntent) {
    await updateDatabaseWithPaymentStatus(paymentIntent, 'succeeded');
    return {
        message: 'Payment succeeded'
    }
};

const handlePaymentIntentPaymentFailed = async function (paymentIntent) {
    await updateDatabaseWithPaymentStatus(paymentIntent, 'failed');
    return {
        message: 'Payment failed'
    };
};

const webhookHandler = async function (req, res) {
    let event = req.body;
    try {
            let response;
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    console.log(paymentIntent.metadata);
                    response = await handlePaymentIntentSucceeded(paymentIntent)
                    res.json(response);
                    break;
        
                case 'payment_intent.payment_failed':
                    const failedPaymentIntent = event.data.object;
                    response = await handlePaymentIntentPaymentFailed(failedPaymentIntent)
                    res.json(response)
                    break;
                
                case 'payment_intent.canceled':
                    const cancelledPaymentIntent = event.data.object;
                    res.status(400).json({message: "Payment cancelled"});
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
                    res.json({ event: event.type});
                    break;
            }
    } catch(err) {
        console.log(err);
        res.status(500).json({message: err.message});
    }
};

module.exports = {

    checkoutSessionHandler,
    updateDatabaseWithPaymentStatus,
    handlePaymentIntentSucceeded,
    handlePaymentIntentPaymentFailed,
    webhookHandler

}