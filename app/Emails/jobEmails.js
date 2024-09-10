const SmtpController = require("../controllers/SmtpController");
const dotenv = require("dotenv");
dotenv.config();
const { BACK_WEB_URL, FRONT_WEB_URL, ADMIN_WEB_URL } = process.env;
const jobAssignToContractor = (options) => {
    let email = options.email;
    let verificationCode = options.verificationCode;
    let fullName = options.firstName ? options.firstName : options.fullName;
    userId = options.userId;

    if (!fullName) {
        fullName = email;
    }
    message = "";

    message+= `
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    <title>Builder-Template</title>
</head>
<body style="font-family: Poppins, sans-serif; background : #f3f3f3;" >
    
    <table width="100%" cellpadding:"0" cellspacing="0">
        <tbody>
            <tr>
                <td style="padding: 50px 20px;">
                    <table width="640px" cellpadding:"0" cellspacing="0" style="margin: 0 auto;background: #DEEFFF;border-radius: 0px 0px;padding: 0px 48px 108px;">
                        <tbody>
                        <tr>
                            <td style="text-align: left;padding: 40px 0px 40px;">
                             <img src="${BACK_WEB_URL}/static/Logo.png" style="width: 24px;object-fit: contain;margin: 0 auto;height: 23px;vertical-align: text-bottom;"> <span style="font-size: 24px; font-weight: bold;" >Builder Management</span>
                            </td>
                        </tr>  
                        <tr>
                            <td style="background-color: #fff;padding: 40px 32px;">
                               <p style="font-size: 24px;font-weight: bold;color:#121A26;margin-bottom: 14px;margin-top: 0px; " >Job Assignment</p> <p style="font-size: 16px;font-weight: 400;color: #384860;">Dear ${fullName},</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;line-height: 21px;padding-right: 31px;margin-top: 0px;">We are pleased to inform you that you have been assigned a new job with us. Below are the details of the assignment:</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Job Title:</strong>${options.jobTitle}</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Job Description:</strong>${options.description}</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Job Location:</strong>${options.location}</p>
                             
                               <a href="${FRONT_WEB_URL}/job/detail?id=${options.id}" style=" background-color: #368AED;color: #fff;width: 130px;display: block;text-align: center;font-size: 14px;padding: 11px 0px;margin: 30px 0px;">View job</a>                             


                             <p style="font-size: 16px;font-weight: 400;color: #384860;margin-bottom: 0px;">Best Regards, </p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;margin: 0px;">Builder Management Team.</p>
                              </td>
                        </tr>
                   </tbody>
                </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>`


    SmtpController.sendEmail(email, `Job Assignment ${options.jobTitle}`, message);
};

const adminEmailForNewJob= (options) => {
    let email = options.email;
    let verificationCode = options.verificationCode;
    let fullName = options.firstName ? options.firstName : options.fullName;
    userId = options.userId;

    if (!fullName) {
        fullName = email;
    }
    message = "";

    message+= `
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    <title>Builder-Template</title>
</head>
<body style="font-family: Poppins, sans-serif; background : #f3f3f3;" >
    
    <table width="100%" cellpadding:"0" cellspacing="0">
        <tbody>
            <tr>
                <td style="padding: 50px 20px;">
                    <table width="640px" cellpadding:"0" cellspacing="0" style="margin: 0 auto;background: #DEEFFF;border-radius: 0px 0px;padding: 0px 48px 108px;">
                        <tbody>
                        <tr>
                            <td style="text-align: left;padding: 40px 0px 40px;">
                             <img src="${BACK_WEB_URL}/static/Logo.png" style="width: 24px;object-fit: contain;margin: 0 auto;height: 23px;vertical-align: text-bottom;"> <span style="font-size: 24px; font-weight: bold;" >Builder Management</span>
                            </td>
                        </tr>  
                        <tr>
                            <td style="background-color: #fff;padding: 40px 32px;">
                               <p style="font-size: 24px;font-weight: bold;color:#121A26;margin-bottom: 14px;margin-top: 0px; " >Job Assignment</p> <p style="font-size: 16px;font-weight: 400;color: #384860;">Dear Admin,</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;line-height: 21px;padding-right: 31px;margin-top: 0px;">We are pleased to inform you that there is a new job created by/for ${options.clientName}. Below are the details of the assignment:</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Job Title:</strong>${options.jobTitle}</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Job Description:</strong>${options.description}</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Job Location:</strong>${options.location}</p>
                             
                               <a href="${FRONT_WEB_URL}/job/detail?id=${options.id}" style=" background-color: #368AED;color: #fff;width: 130px;display: block;text-align: center;font-size: 14px;padding: 11px 0px;margin: 30px 0px;">View job</a>                             


                             <p style="font-size: 16px;font-weight: 400;color: #384860;margin-bottom: 0px;">Best Regards, </p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;margin: 0px;">Builder Management Team.</p>
                              </td>
                        </tr>
                   </tbody>
                </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>`


    SmtpController.sendEmail(process.env.ADMIN_EMAIL, `Job Assignment ${options.jobTitle}`, message);
};


module.exports={
    jobAssignToContractor:jobAssignToContractor,
    adminEmailForNewJob:adminEmailForNewJob
}