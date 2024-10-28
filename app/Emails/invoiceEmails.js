const SmtpController = require("../controllers/SmtpController");
const dotenv = require("dotenv");
dotenv.config();
const { BACK_WEB_URL, FRONT_WEB_URL, ADMIN_WEB_URL } = process.env;

/*
const sendInvoiceMail = (options) => {
    let email = options.email;
    let fullName = options.fullName;
    let invoiceId = options["_id"]? options["_id"]: options["invoiceId"];
    let datelog = options["datelog"];
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
                        <td style="padding: 10px 0;">${material["name"]}</td>
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
*/


const sendInvoiceMail = (options) => {
    let email = options.email;
    let fullName = options.fullName;
    let invoiceId = options["_id"]? options["_id"]: options["invoiceId"];
    let datelog = options["datelog"];
    if (!fullName) {
        fullName = email;
    }

    let message = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <div style="width: 700px; padding: 2rem; background-color:#fff; margin: auto;  
            box-shadow: 3px 1px 8px 4px #80808040; ">
                <table>
                    <tbody>
                        <tr>
                            <td colspan="4">
                                <h3 style="font-size: 14px;margin: 0px;
                                font-family: sans-serif;font-weight: 800;
                                color: black;">${options.addedBy.company}</h3>
                                <p style="font-size: 14px;
                                font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">${options.addedBy.address}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.addedBy.city}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.addedBy.state}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.addedBy.zipCode}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.addedBy.email}</p>
                                <p style="font-size: 14px;
                                font-family: sans-serif;font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.addedBy.website}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">VAT Registration No.: ${options.addedBy.vat_number}</p>
                            </td>
                            <td colspan="4" style="width: 100%;text-align: right;">
                                <img src="https://cdn-icons-png.freepik.com/512/1343/1343669.png?ga=GA1.1.1780752125.1727170430" alt="" style="width: 200px">
                            </td>
                        </tr>
                        <tr style="vertical-align: unset;">
                            <td colspan="4">
                                <h3 style="font-size: 14px;margin: 0px;
                                font-family: sans-serif;font-weight: 800;
                                color: black;margin-top: 30px;">INVOICE TO</h3>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.client.fullName}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.client.company}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.client.address}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.client.city}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.client.zipCode}</p>
                            </td>
                        
                            <td style="width: 80%; text-align: end;" >
                                <h3 style="font-size: 14px;margin-top: 7px;margin-bottom: 7px;
                                margin-right: 6px;font-family: sans-serif;font-weight: 800;
                                color: black;text-align: right;">INVOICE NO.</h3>
                                <h3 style="font-size: 14px;margin-top: 7px;margin-bottom: 7px;
                                margin-right: 6px;font-family: sans-serif;font-weight: 800;
                                color: black;text-align: right;">DATE</h3>
                                <h3 style="font-size: 14px;margin-top: 7px;
                                margin-bottom: 7px;margin-right: 6px;
                                font-family: sans-serif;font-weight: 800;
                                color: black;text-align: right;">DUE DATE</h3>
                                <h3 style="font-size: 14px;margin-bottom: 7px;margin-right: 6px;
                                margin-top: 7px;font-family: sans-serif;font-weight: 800;
                                color: black;text-align: right;">TERMS</h3>
                            </td>
                            <td>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.invoiceNumber}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.sentDate}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.dueDate}</p>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">${options.terms} days</p>
                            </td>           
                        </tr>
                        <tr>
                            <td colspan="8" >
                                <p style="background: #00b0ff4d;height: 0.1px;"></p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            
                <table style="width: 100%; margin-top: 40px " cellspacing="0">
                    <tbody>
                    <tr style="background: #b2e7ff6b;">
                        <th style="text-align: justify;font-size: 11px;
                        font-family: sans-serif;font-weight: 200;
                        color: #58abed;border: 0px;padding: 8px 2px;">DATE</th>
                        <th style="text-align: justify;font-size: 11px;
                        font-family: sans-serif;font-weight: 200;
                        color: #58abed;border: 0px;
                        padding: 8px 2px;">ACTIVITY</th> 
                        <th style="text-align: justify;font-size: 11px;
                        font-family: sans-serif;font-weight: 200;
                        color: #58abed;border: 0px;
                        padding: 8px 2px;">DESCRIPTION</th>
                        <th style="text-align: justify;font-size: 11px;
                        font-family: sans-serif;font-weight: 200;
                        color: #58abed;border: 0px;
                        padding: 8px 2px;">QTY</th>
                        <th style="text-align: justify;font-size: 11px;
                        font-family: sans-serif;font-weight: 200;
                        color: #58abed;border: 0px;
                        padding: 8px 2px;">VAT</th>
                        <th style="text-align: justify;font-size: 11px;
                        font-family: sans-serif;font-weight: 200;
                        color: #58abed;border: 0px;
                        padding: 8px 2px;">RATE</th>
                        <th style="text-align: end;font-size: 11px;
                        font-family: sans-serif;font-weight: 200;
                        color: #58abed;border: 0px;
                        padding: 8px 2px;text-align:left;">AMOUNT</th>
                    </tr>`;
                    for(let datelog of options.datelog) {
                        if(Number(datelog.labour_charge)) {
                            message += `<tr style="vertical-align: unset;">
                                <td style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;width: 86px;padding: 0px 2px;">
                                    <p style="margin-top: 7px;">${datelog.date}</p></td>
                                <td style="font-size: 14px;
                                font-family: sans-serif;
                                font-weight: 700;padding: 0px 2px;">Services</td>
                                <td style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300; width: 142px;padding: 0px 2px;">${datelog.service_description}</td>
                                <td style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;text-align: left;padding: 0px 2px;">${datelog.service_quantity}</td>
                                <td style="font-size: 14px;font-family: sans-serif;font-weight: 300; 
                                font-size: 14px;font-family: sans-serif;
                                font-weight: 300;padding: 0px 2px;">${datelog.VAT_rate_labour_visible}</td>
                                <td style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;padding: 0px 2px;">${datelog.labour_charge}</td>
                                <td style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300; text-align: end;padding: 0px 2px;">${datelog.labour_charge}</td>
                            </tr>`;
                        }
                        
                        for(let material of datelog.material) {
                            message += ` <tr style="vertical-align: unset;">
                            <td style="font-size: 14px;font-family: sans-serif;
                            font-weight: 300; width: 86px;padding: 0px 2px;">${datelog.date}</td>
                            <td style="font-size: 14px;font-family: sans-serif;
                            font-weight: 700;padding: 0px 2px;">Materials</td>
                            <td style="font-size: 14px;font-family: sans-serif;
                            font-weight: 300;width: 142px;padding: 0px 2px;">${material.description}</td>
                            <td style="font-size: 14px;font-family: sans-serif;
                            font-weight: 300;text-align: left;padding: 0px 2px;">${material.quantity}</td>
                            <td style="font-size: 14px;font-family: sans-serif;font-weight: 300; font-size: 14px;
                            font-family: sans-serif;font-weight: 300;padding: 0px 2px;">${material.vat_rate_visible}</td>
                            <td style="font-size: 14px;font-family: sans-serif;
                            font-weight: 300;padding: 0px 2px;">${material.price}</td>
                            <td style="font-size: 14px;font-family: sans-serif;
                            font-weight: 300; text-align: end;padding: 0px 2px;">${material.price}</td>
                            </tr>` 
                        }
                }

                message +=  `</tbody>
                </table>
                
                <table style="width: 100%; margin-top: 20px; border-top-style: dotted;">
                    <tbody >
                        <tr style="vertical-align: unset;">
                            <td colspan="2" >
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">Thank you for your business!</p>
                            </td>
                            <td>
                                <p style="font-size: 14px;font-family: sans-serif;
                                font-weight: 300;margin-top: 7px;
                                margin-bottom: 7px;">SUBTOTAL</p>
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">VAT TOTAL</p>
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">TOTAL</p>
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">PAYMENT</p>
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">BALANCE DUE</p>
                            </td>
                    
                            <td style="text-align: end;">
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">£${options.subtotal}</p>
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">£${options.vat_total}</p>
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">£${options.total}</p>
                                <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                margin-top: 7px;margin-bottom: 7px;">£${options.total}</p>
                                <h3 style="font-size: 14px;margin: 0px;font-family: sans-serif;
                                font-weight: 800;color: black;">£${options.balance_due}</h3>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table style="width: 100%; margin-top: 30px " cellspacing="0">
                    <tbody>
                        <tr style="background: #b2e7ff6b;">
                            <th style="text-align: end; width: 231px;font-size: 11px;
                                font-family: sans-serif;font-weight: 200;color: #58abed;border: 0px;
                                padding: 9px 8px;">RATE</th>
                            <th style="text-align: end;font-size: 11px;font-family: sans-serif;
                            font-weight: 200;color: #58abed;border: 0px;padding: 9px 8px;">VAT</th> 
                            <th style="text-align: end;font-size: 11px;
                            font-family: sans-serif;font-weight: 200;color: #58abed;
                            border: 0px;padding: 9px 8px;">NET</th>
                        </tr>`
                for(let row of options.vat_summary) {
                    message += `<tr style="font-size: 14px;font-family: sans-serif;font-weight: 300;text-align: end;">
                                    <td>
                                        <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                        margin-top: 7px;margin-bottom: 7px;text-align:center;">VAT @ ${row.rate}%</p>
                                    </td>
                                    <td>
                                        <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                        margin-top: 7px;margin-bottom: 7px;text-align:center;">${row.vat_amount}</p>
                                    </td>
                                    <td>
                                        <p style="font-size: 14px;font-family: sans-serif;font-weight: 300;
                                        margin-top: 7px;margin-bottom: 7px;text-align:center;">${row.net}</p>
                                    </td>
                            </tr>`
                }
                        
                message +=  `</tbody>
                        </table>
                        <table>
                            <tbody>
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="font-size: 13px;font-family: sans-serif;
                                        font-weight: 300;margin-top: 22px;
                                        margin-bottom: 3px;">Preferred payment method</p>
                                        <p style="font-size: 13px;font-family: sans-serif;
                                        font-weight: 300;margin-top: 3px;
                                        margin-bottom: 3px;">Bank Transfer</p>
                                        <p style="font-size: 13px;font-family: sans-serif;
                                        font-weight: 300;margin-top: 3px;
                                        margin-bottom: 3px;">As reference please use Invoice Number</p>
                                        <p style="font-size: 13px;font-family: sans-serif;font-weight: 300;
                                        margin-top: 3px;margin-bottom: 3px;">Account details ${options.addedBy.bank_account_details.account_holder_name}</p>
                                        <p style="font-size: 13px;font-family: sans-serif;font-weight: 300;
                                        margin-top: 3px;margin-bottom: 3px;">Account No ${options.addedBy.bank_account_details.account_number} Sort Code ${options.addedBy.bank_account_details.sort_code}</p>
                                        <p style="font-size: 13px;font-family: sans-serif;
                                        font-weight: 300;margin-top: 3px;margin-bottom: 3px;">Polite Note The customer shall be liable to pay 
                                            all costs, fees, disbursements and charges including legal fees and costs reasonably incurred 
                                            by the client in the recovery of any unpaid invoices regardless
                                            of the value of the claim.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                    </div>
                </body>
                </html>`;
    SmtpController.sendEmail(email, `Invoice #${options.invoiceNumber}`, message);

}


module.exports={
    sendInvoiceMail
}