/**
 * SmtpController
 *
 * @description :: Server-side logic for managing Smtp
 * @help        ::
 */

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

module.exports = {
  sendEmail: (to, subject, message, next) => {
    transport = nodemailer.createTransport(
      smtpTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        debug: true,
        sendmail: true,
        requiresAuth: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })
    );
    transport.sendMail(
      {
        from: 'Builder Management  <' + process.env.SMTP_USER + '>',
        to: to,
        subject: subject,
        html: message,
      },
      function (err, info) {
        console.log('err', err, info);
      }
    );
  },
};
