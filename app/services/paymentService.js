const db = require('../models');
var mongoose = require('mongoose');

module.exports.checkoutSessionHandler = async function (invoice) {
  let amount = invoice["total"];
  amount = amount * 100;
  amount = Math.ceil(amount); //just to convert to integer - number of pennies
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
          jobId: invoice.jobId.toString(),
          invoiceId: invoice._id.toString()
      }
  },
  mode: 'payment',
  success_url: process.env.FRONT_WEB_URL+`/job/detail/${invoice.jobId}`,
  cancel_url: process.env.FRONT_WEB_URL + `/cancelPayment`
  });    
  return session;
};
