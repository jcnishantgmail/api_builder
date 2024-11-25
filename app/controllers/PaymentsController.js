const db = require("../models");
const mongoose = require("mongoose");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const updateDatabaseWithPaymentStatus = async function(paymentIntent, status) {
    if(status === 'succeeded') {
        const paymentDoc = await db.payments.create({id: paymentIntent.id, invoiceId: paymentIntent.metadata.invoiceId,
            job: paymentIntent.metadata.jobId,
            user: paymentIntent.metadata.user,
            paymentType: "stripe",
            status: "successful"});
        const updatedInvoice = await db.invoices.updateOne({ _id:paymentIntent.metadata.invoiceId}, {paidDate: paymentDoc["createdAt"], paymentType: 'stripe', paymentId: paymentDoc["_id"], status: "paid" });
        const updatedJob = await db.jobs.updateOne({_id: paymentIntent.metadata.jobId}, {invoiceStatus: "paid"});
        return paymentIntent;
    }
    else if(status === 'failed') {
        const paymentDoc = await db.payments.create({id: paymentIntent.id, invoiceId: paymentIntent.metadata.invoiceId,
            job: paymentIntent.metadata.jobId,
            user: paymentIntent.metadata.user,
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
                    res.json({ event: event.type});
                    break;
            }
    } catch(err) {
        res.status(500).json({message: err.message});
    }
};

async function checkPaymentStatus(req, res) {
    const {sessionId} = req.body;
    try {
       
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        
        const paymentIntentId = session.payment_intent;
        if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent && paymentIntent.last_payment_error) {
                return res.status(200).json({status: "Failed", message: paymentIntent.last_payment_error.message});
            } else {
                return res.status(200).json({status: paymentIntent.status, message: ""});
            }
        } else {
            return res.status(404).json({message: 'No PaymentIntent associated with this session.'});
        }
    } catch (error) {
        return res.status(500).json({message: err.message});
    }
}


async function paymentListing(req, res) {
    let { search, page, count, jobId, invoiceId, startDate, endDate, paymentType, status, user, sortBy} = req.query;
    try {
        //No search funcionality for now
        let query = {};
        if(jobId) {
            query.job = jobId;
        }

        if(invoiceId) {
            query.invoiceId = invoiceId;
        }

        if(startDate && endDate) {
            startDate = new Date(startDate).setUTCHours(0, 0, 0, 0);
            endDate = new Date(endDate).setUTCHours(23, 59, 59, 0);
            query.createdAt = {$gte: startDate, $lte: endDate};
        }

        if(paymentType) {
            query.paymentType = paymentType;
        }

        if(status) {
            query.status = status;
        }

        if(user) {
            query.user = mongoose.Types.ObjectId.createFromHexString(user);
        }

        query.isDeleted = false;
        let field, sortType;
        if(sortBy) {
            let order = sortBy.split(" ");
            field = order[0];
            sortType = order[1];
        }
        let sortquery = {};
        sortquery[field? field: "createdAt"] = sortType === 'asc'
            ? 1 
            : -1;

        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "jobs",
                    localField: "job",
                    foreignField: "_id",
                    as: "job"
                }
            },
            {
                $unwind: {
                    path: "$job",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $lookup: {
                    from: "invoices",
                    localField: "invoiceId",
                    foreignField: "_id",
                    as: "invoice"
                }
            },
            {
                $unwind: {
                    path: "$invoice",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $project: {
                    _id: 1,
                    id: 1,
                    job: "$job",
                    invoiceId: 1,
                    paymentType: 1,
                    user: "$user",
                    status: 1,
                    createdAt: 1,
                    amount: "$invoice.total"
                }
            },
            {
                $sort: sortquery
            }
        ];
        let total = await db.payments.aggregate(pipeline);
        if(page && count) {
            page = +page;
            count = +count;
            const skipNo = (page - 1) * count;
            pipeline.push({$skip: skipNo}, {$limit: count});
        }
        let result = await db.payments.aggregate(pipeline);
        return res.status(200).json({
            success: true, 
            data: result,
            total: total.length
        });
    } catch(err) {
        return res.status(500).json({success: false, message: err.message});
    }
    
}

async function paymentDelete(req, res) {
    try {
        const paymentId = req.query.paymentId;
        const existing = await db.payments.findOne({_id:paymentId, isDeleted: false});
        if(!existing) {
          return res.status(404).json({message: "Payment to be deleted doesn't exist!", success: false});
        }
        const updatedStatus = await db.payments.updateOne({
          _id: paymentId,
          isDeleted: false
        }, {
          isDeleted: true
        });
        return res.status(200).json({
            success: true,
            message: "Payment deleted successfully!",
          });
        } catch (err) {
            return res.status(500).json({
            success: false,
            error: {
                code: 500,
                message: err.message
            },
            });
        }
}

module.exports = {

    updateDatabaseWithPaymentStatus,
    handlePaymentIntentSucceeded,
    handlePaymentIntentPaymentFailed,
    webhookHandler,
    checkPaymentStatus,
    paymentListing,
    paymentDelete

}