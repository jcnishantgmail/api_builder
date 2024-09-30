const SmtpController = require("../controllers/SmtpController");
const dotenv = require("dotenv");
dotenv.config();
const { BACK_WEB_URL, FRONT_WEB_URL, ADMIN_WEB_URL } = process.env;


const sendInvoiceMail = (options) => {
    let email = options.email;
    let fullName = options.fullName;
    let invoiceId = options["_id"]? options["_id"]: options["invoiceId"];
    if (!fullName) {
        fullName = email;
    }
    let message = '';
    message += `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Invoice Template</title>
            <script src="https://js.stripe.com/v3/"></script>
        </head>
        <body style="font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; text-align: center; background-color: #f9f9f9; color: #777; margin: 0; padding: 0;">
            <div style="max-width: 800px; margin: 30px auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.1); background-color: #fff; font-size: 16px; line-height: 24px; color: #555;">
                <table style="width: 100%; line-height: inherit; text-align: left; border-collapse: collapse;">
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <td colspan="2" style="padding-bottom: 20px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="font-size: 45px; line-height: 45px; color: #333;">
                                        <img src="${BACK_WEB_URL}/static/Logo.png" alt="Company Logo" style="width: 150px; max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);" />
                                    </td>
                                    <td style="text-align: right; vertical-align: top; padding-left: 20px;">
                                        <div style="font-size: 18px; font-weight: bold; color: #333;"># ${options.invoiceNumber}</div>
                                        <div style="color: #777;">Created: ${options.creationTime}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr style="padding-bottom: 40px;">
                        <td colspan="2">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="text-align: left; color: #555;">
                                        <div style="font-weight: bold;">Builder Inc.</div>
                                        <div>49 Featherstone Street</div>
                                        <div>London - 181397</div>
                                    </td>
                                    <td style="text-align: right; color: #555;">
                                        <div style="font-weight: bold;">${fullName}</div>
                                        <div>${email}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr style="background: #f1f1f1; border-bottom: 2px solid #ddd; font-weight: bold;">
                        <td style="padding: 10px 0;">Material/Service</td>
                        <td style="text-align: right; padding: 10px 0;">Price</td>
                    </tr>`;

    for (let material of options.material) {
        material["price"] = (Math.ceil(material["price"] * 100) / 100);
        message += `<tr style="border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 10px 0;">${material["name"]} (Quantity: ${material["quantity"]})</td>
                        <td style="text-align: right; padding: 10px 0;">£${material["price"]}</td>
                    </tr>`;
    }

    message += `<tr>
                    <td style="font-weight: bold;">Service Fee</td>
                    <td style="text-align: right; padding: 10px 0;">£${Math.ceil(options.servicefee * 100)/100}</td>
                </tr>
                <tr style="border-top: 2px solid #e0e0e0; font-weight: bold;">
                    <td style="padding: 10px 0;">Total</td>
                    <td style="text-align: right; padding: 10px 0;">£${options.total}</td>
                </tr>
                </table>
                <a href="${process.env.FRONT_WEB_URL}?invoiceId=${invoiceId}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #1E5DBC; text-decoration: none; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">Pay Now</a>
            </div>
        </body>
    </html>`;


    SmtpController.sendEmail(email, `Invoice #${options.invoiceNumber}`, message);
};




module.exports={
    sendInvoiceMail
}


