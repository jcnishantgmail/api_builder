const SmtpController = require("../controllers/SmtpController");
const dotenv = require("dotenv");
dotenv.config();
const { BACK_WEB_URL, FRONT_WEB_URL, ADMIN_WEB_URL } = process.env;
const { formatDatetime } = require("../utls/helper");


const sendInvoiceMail = (options) => {
    let email = options.email;
    options.materials = options.materials.map((material) => {
        material.date = new Date(material.date);
        return material;
    });

    options.services = options.services.map((service) => {
        service.date = new Date(service.date);
        return service;
    });
    let materialsAndServices = options.services.concat(options.materials);
    materialsAndServices.sort((a, b) => {
        return a.date - b.date;
    });
    
    let message = `<!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice</title>
        </head>

        <body>`;
        
        message += `<div style="padding: 2rem; padding-left: 0px;">`;  // Removed extra space before the closing '>'
        if(options.emailText?.greeting && options.emailText.greeting != '') {
            message += `<div style="font-weight:600;margin-bottom:10px;">${options.emailText.greeting}</div>`;
        }
        
        if(options.emailText?.content && options.emailText.content != '') {
            message += `<div style="margin-bottom:10px;">${options.emailText.content}</div>`;
        }
        
        if(options.emailText?.paymentInstruction && options.emailText.paymentInstruction != '') {
            message += `<div>${options.emailText.paymentInstruction}</div>`;
        }
        message += `</div>`;
        ///////////////////
        
        
        message +=   `<table style="max-width: 700px; width: 100%; padding: 2rem; background-color: #fff; margin: auto; box-shadow: 3px 1px 8px 4px #80808040;">
        <tr>
            <td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tbody>
                        <tr>
                            <td>`;
                            message += (options.admin_info?.company
                                        ?`<h3 style="font-size: 14px; margin: 0; font-family: sans-serif; font-weight: 800; color: black;">${options.admin_info.company}</h3>`
                                        :'');

                                                
                            message += (options.admin_info?.address
                                        ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.admin_info.address}</p>`   
                                        : '');  
                                        
                            message += (options.admin_info?.city
                                        ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.admin_info.city}</p>` 
                                        : '');
                                        
                            message += (options.admin_info?.state
                                        ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.admin_info.state}</p>`   
                                        : '');
                                        
                            message += (options.admin_info?.zipCode
                                        ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.admin_info.zipCode}</p>`   
                                        : '');
                                       
                            message += (options.admin_info?.email
                                        ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.admin_info.email}</p>`  
                                        : '');

                            message += (options.admin_info?.website
                                        ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.admin_info.website}</p>`  
                                        : '');

                            message += (options.admin_info?.vat_number
                                        ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">VAT
                                        Registration No.: ${options.admin_info.vat_number}</p>`   
                                        : '');

                            
                            message += `</td>
                                        <td style="text-align: right;">
                                            <img src="${BACK_WEB_URL}/img/${options.logoURL}" alt="Logo" style="max-width: 250px; width: 100%;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <h3
                                                style="font-size: 14px; margin: 30px 0 7px 0; font-family: sans-serif; font-weight: 800; color: black;">
                                                INVOICE TO</h3>`;
                               
                            message += (options.client_info.fullName? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.client_info.fullName}</p>`: ``);
                            message += (options.client_info.company ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.client_info.company}</p>`: ``);

                            message += (options.client_info.address ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.client_info.address}</p>`: ``);

                            message += (options.client_info.city? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.client_info.city}</p>`: ``);

                            message += (options.client_info.zipCode ? `<p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${options.client_info.zipCode}</p>`: ``); 

                            message += `</td>
                                        <td style="text-align: right;">
                                            <h3
                                                style="font-size: 14px;  font-family: sans-serif; font-weight: 800; color: black; width:150px;text-align: left; margin: 7px 0 5px auto; ">
                                                INVOICE NO: <span
                                                    style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin-left: 3px;">${options.invoiceNumber}</span>
                                            </h3>
                                            <h3
                                                style="font-size: 14px;  font-family: sans-serif; font-weight: 800; color: black; width:150px;text-align: left; margin: 7px 0 5px auto; ">
                                                DATE:<span
                                                    style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin-left: 3px;">${formatDatetime(options.sentDate)}</span>
                                            </h3>
                                            <h3
                                                style="font-size: 14px;  font-family: sans-serif; font-weight: 800; color: black; width:150px;text-align: left; margin: 7px 0 5px auto;">
                                                DUE DATE:<span
                                                    style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin-left: 3px;">${formatDatetime(options.dueDate)}</span>
                                            </h3>
                                            <h3
                                                style="font-size: 14px;  font-family: sans-serif; font-weight: 800; color: black; width:150px;text-align: left; margin: 7px 0 5px auto;">
                                                TERMS: <span
                                                    style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin-left: 3px; ">${options.terms} days</span></h3>
                                        </td>
                    
                                    </tr>
                    
                                </tbody>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <hr style="border: none; height: 1px; background: #00b0ff4d;">
                                    </td>
                                </tr>
                            </table>
                            <table style="width: 100%; margin-top: 50px;" cellspacing="0">
                                <thead style="background: #b2e7ff6b;">
                                <tr>
                            <th
                                style="text-align: left; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; padding: 8px;">
                                DATE</th>
                            <th
                                style="text-align: left; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; padding: 8px;">
                                ACTIVITY</th>
                            <th
                                style="text-align: left; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; padding: 8px;">
                                DESCRIPTION</th>
                                <th
                                style="text-align: left; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; padding: 8px;">
                                RATE</th>
                            <th
                                style="text-align: left; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; padding: 8px;">
                                QTY</th>
                            <th
                                style="text-align: left; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; padding: 8px;">
                                VAT</th>
                            <th
                                style="text-align: left; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; padding: 8px;">
                                AMOUNT</th>
                            
                        </tr>
                    </thead>
                    <tbody>`;
                        ///Done till here
                    for(let entry of materialsAndServices) {
                        if('service_description' in entry) {
                            message += `<tr>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${formatDatetime(entry.date)}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 700; padding: 8px;">Services</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.service_description}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.labour_charge}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.service_quantity}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.VAT_rate_labour_visible}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.labour_charge}</td>
                                        </tr>`;
                        }
                        else {
                            message += `<tr>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${formatDatetime(entry.date)}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 700; padding: 8px;">Materials</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.material_description}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.rate}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.quantity}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.VAT_rate_labour_visible}</td>
                                            <td style="font-size: 14px; font-family: sans-serif; font-weight: 300; padding: 8px;">${entry.price}</td>
                                        </tr>`;
                        }
                    }

                message += `</tbody>
                        </table>
                
                        <table style="width: 100%; margin-top: 20px; border-top: 1px dotted;">
                            <tbody>
                                <tr>
                                    <td style="text-align: right; padding: 8px;">
                                        <p style="font-size: 14px; font-family: sans-serif; font-weight: 300;">SUBTOTAL: £${options.subtotal}</p>
                                        <p style="font-size: 14px; font-family: sans-serif; font-weight: 300;">VAT TOTAL: £${options.vat_total}</p>
                                        <p style="font-size: 14px; font-family: sans-serif; font-weight: 300;">TOTAL: £${options.total}</p>
                                        <p style="font-size: 14px; font-family: sans-serif; font-weight: 300;">PAYMENT: £${options.total}</p>
                                        <p style="font-size: 14px; font-family: sans-serif; font-weight: 800; color: black;">BALANCE DUE: £${options.balance_due}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                
                        <table style="width: 100%; margin-top: 30px;" cellspacing="0">
                            <tbody>
                                <!-- Header Row -->
                                <tr style="background: #b2e7ff6b;">
                                    <th
                                        style="text-align: center; width: 231px; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; border: 0; padding: 8px 2px;">
                                        RATE</th>
                                    <th
                                        style="text-align: center; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; border: 0; padding: 8px 2px;">
                                        VAT</th>
                                    <th
                                        style="text-align: center; font-size: 11px; font-family: sans-serif; font-weight: 200; color: #58abed; border: 0; padding: 8px 2px;">
                                        NET</th>
                                </tr>`
                for(let row of options.vat_summary) {
                    message += `<tr style="font-size: 14px; font-family: sans-serif; font-weight: 300; text-align: center;">
                            <td>
                                <p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">VAT @ ${row.rate}%</p>
                            </td>
                            <td>
                                <p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${row.vat_amount}</p>
                            </td>
                            <td>
                                <p style="font-size: 14px; font-family: sans-serif; font-weight: 300; margin: 7px 0;">${row.net}</p>
                            </td>
                        </tr>`;
                }
                message += ` </table>
                            <!-- Preferred Payment Section -->
                            <table style="width: 100%; margin-top: 20px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="font-size: 13px; font-family: sans-serif; font-weight: 300; margin: 22px 0 3px;">Preferred
                                            payment method</p>
                                        <p style="font-size: 13px; font-family: sans-serif; font-weight: 300; margin: 3px 0;">Card</p>
                                        <p style="font-size: 13px; font-family: sans-serif; font-weight: 300; margin: 3px 0;">As reference
                                            please use Invoice Number</p>
                                        <p style="font-size: 13px; font-family: sans-serif; font-weight: 300; margin: 3px 0;">Account
                                            details: ${options.bank_account_details.account_holder_name}</p>
                                        <p style="font-size: 13px; font-family: sans-serif; font-weight: 300; margin: 3px 0;">Account No: ${options.bank_account_details.account_number} Sort Code: ${options.bank_account_details.sort_code}</p>
                                        <p style="font-size: 13px; font-family: sans-serif; font-weight: 300; margin: 3px 0;">
                                            ${options.conditions}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center;">
                                        <form action="${BACK_WEB_URL}/invoice/payInvoice" method="POST" style="display: inline-block; margin-top: 20px;">
                                            <input type="hidden" name="invoiceId" value="${options._id}">
                                            <button type="submit" style="padding: 10px 20px; font-size: 14px; font-family: sans-serif; color: white; background-color: #00b0ff; text-decoration: none; border: none; border-radius: 4px; cursor: pointer;">
                                                Pay Now
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>`;        
                
                message += `<div  style="padding: 2rem; padding-left:0;" >`;
                if(options.emailText?.supportOffer && options.emailText.supportOffer != '') {
                    message += `<div>${options.emailText.supportOffer}</div>`;
                }
                if(options.emailText?.appreciation && options.emailText.appreciation != '') {
                    message += `<div style="margin-top:10px; margin-bottom:10px;">${options.emailText.appreciation}</div>`;
                }
                if(options.emailText?.closingSalutation && options.emailText.closingSalutation != '') {
                    message += `<div style="font-weight:600;">${options.emailText.closingSalutation}</div>`;
                }
                if(options.emailText?.senderName && options.emailText.senderName != '') {
                    message += `<div style="margin-top:8px; margin-bottom:8px; ">${options.emailText.senderName}</div>`;
                }
                if(options.emailText?.senderCompany && options.emailText.senderCompany != '') {
                    message += `<div>${options.emailText.senderCompany}</div>`;
                }
                message += `</div>`;
                message += `</body></html>`;
    let formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short', 
        day: '2-digit', 
        year: 'numeric' 
        }).format(options.dueDate);
    SmtpController.sendEmail(email, `Invoice #${options.invoiceNumber} from ${options.admin_info.company} - Due ${formattedDate}`, message);
}

module.exports={
    sendInvoiceMail
}