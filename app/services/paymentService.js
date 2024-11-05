const db = require('../models');
var mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports.checkoutSessionHandler = async function (invoice) {
  let amount = invoice["total"];
  amount = amount * 100;
  amount = Math.ceil(amount); //just to convert to integer - number of pennies
  let jobId = invoice.jobId._id.toString();
  console.log("jobId", jobId);
  const session = await stripe.checkout.sessions.create({
  line_items: [
      {
          price_data: {
              currency: 'gbp',    
              product_data: {
                  name: "Invoice #" + invoice["invoiceNumber"],
              },
              unit_amount: amount
          },
          quantity: 1
      }
  ],
  payment_intent_data: {
      metadata: {
          jobId: jobId,
          invoiceId: invoice._id.toString(),
          user: invoice.client.toString()
      }
  },
  mode: 'payment',
  success_url: process.env.FRONT_WEB_URL+`/job/detail/${jobId}/${invoice.jobId.contractor.toString()}`,
  cancel_url: process.env.FRONT_WEB_URL + `/cancelPayment`
  });    
  console.log(session.url);
  return session;
};
