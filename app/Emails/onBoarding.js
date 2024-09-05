const SmtpController = require("../controllers/SmtpController");
const dotenv = require("dotenv");
dotenv.config();

const { STAGING_FRONTEND_URL, STAGING_ADMIN_URL, BACK_WEB_URL, FRONT_WEB_URL, ADMIN_WEB_URL } = process.env;

const forgotPasswordEmail = (options) => {
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
                               <p style="font-size: 24px;font-weight: bold;color:#121A26;margin-bottom: 14px;margin-top: 0px; " >Password Reset</p> <p style="font-size: 16px;font-weight: 400;color: #384860;">Hello ${fullName},</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;line-height: 21px;padding-right: 31px;margin-top: 0px;">We have received your request to reset your password. </p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;">Click the button below to reset your password.</p>`

                               if (options.loginPortal != "admin") {
                                message += `<a href="${FRONT_WEB_URL}/resetpassword?id=${userId}&code=${verificationCode}" style=" background-color: #368AED;color: #fff;width: 130px;display: block;text-align: center;font-size: 14px;padding: 11px 0px;margin: 30px 0px;">Reset Password</a>`
                             
                            } else {
                                  message += `<a href="${ADMIN_WEB_URL}/resetpassword?id=${userId}&code=${verificationCode}" style=" background-color: #368AED;color: #fff;width: 130px;display: block;text-align: center;font-size: 14px;padding: 11px 0px;margin: 30px 0px;">Reset Password</a>`
                            }

                             message += `<p style="font-size: 16px;font-weight: 400;color: #384860;margin-bottom: 0px;">Best Regards, </p>
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


    SmtpController.sendEmail(email, "Reset Password", message);
};


const add_user_email = (options) => {
    let email = options.email;
    let fullName = options.fullName;
    let password = options.password;
    let roleName = options.role

    if (!fullName) {
        fullName = email;
    }
    message = "";


    message +=`  
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
                               <p style="font-size: 24px;font-weight: bold;color:#121A26;margin-bottom: 14px;margin-top: 0px; " >User Registration.</p> <p style="font-size: 16px;font-weight: 400;color: #384860;">Hello ${fullName},</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;line-height: 21px;padding-right: 31px;margin-top: 0px;">Congratulations! Your account has created on Builder Portal. Please use the following credentials to log in: </p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Email:</strong> ${email}</p>
                               <p style="font-size: 16px;font-weight: 400;color: #384860;"><strong>Password:</strong> ${password}</p>
                             <a href="${FRONT_WEB_URL}/login" style=" background-color: #368AED;color: #fff;width: 130px;display: block;text-align: center;font-size: 14px;padding: 11px 0px;margin: 30px 0px;">Login Now</a>
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
</html>  `



    SmtpController.sendEmail(email, `Registeration`, message);
};

const invite_user_email = (options) => {
    let email = options.email;
    let type = options.type;
    let fullName = options.fullName;
    let password = options.password;

    if (!fullName) {
        firstName = email;
    }
    message = "";
    message += `
  <!DOCTYPE html>
  <html>
  
  <head>
      <title>SafeSpots</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet">
  
      <style>
          @media (max-width:767px) {
              .w-100 {
                  width: 100%;
              }
  
              .fz-20 {
                  font-size: 25px !important;
              }
          }
      </style>
  
  </head>
  
  <body style="font-family: 'Poppins', sans-serif; background:#fff;">
      <table width="100%" cellpadding:"0" cellspacing="0">
          <tbody>
              <tr>
                  <td style="padding: 50px 20px;">
                      <table width="676px" cellpadding:"0" cellspacing="0" style="margin: 0 auto; background:#F2F5FF
                      ;"
                          class="w-100">
                          <tr>
                              <td style="height:40px;">
  
                              </td>
                          </tr>
                     
                          <tr>
                              <td style="text-align:center; padding-bottom: 10px; height: 50px;">
                                  <img src="${FRONT_WEB_URL}/assets/img/logo.png"
                                  style="width: 120px; margin: 0 auto;" />
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 20px 60px;">
                                  <table width="100%;cellpadding:"0" cellspacing="0" ">
                                      <tr>
                                          <td style="border-bottom: 1px solid 
                              #E2E8F0; ">
  
                              </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td style="text-align:center; padding-bottom: 10px; ">
                                  <img src="${BACK_WEB_URL}/static/banner.png"
                                  style="width: 340px; margin: 0 auto;" />
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 20px 60px;">
                                  <table width="100%;cellpadding:"0" cellspacing="0" ">
                                      <tr>
                                          <td style="border-bottom: 1px solid
                              #E2E8F0; ">
  
                              </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td style="text-align:center;">
                                  <p style="font-size:22px; max-width: 400px; margin:0 auto; font-weight: 600; padding: 0 20px; color: #384860; line-height: 24px;"
                                      class="fz-20">Hi ${options.fullName},
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 15px 0 25px 0;">
                                  <p
                                      style="font-size:16px; max-width: 400px; margin:0 auto; text-align: center; color: #6D6D6D; line-height: 25px; padding: 0 20px;">
                                       <span style="font-weight: 600;"> Email </span>
                                       ${email}
                                  </p>
                                  <p
                                      style="font-size:16px; max-width: 400px; margin:0 auto; text-align: center; color: #6D6D6D; line-height: 25px; padding: 0 20px;">
                                       <span style="font-weight: 600;"> Password </span>
                                       ${password}.
                                  </p>
                                  <p>
                                    

                                  </p>
                              </td>
                          </tr>

                          <tr>
                              <td>`
    if (type == 'new_talent') {
        message += `    <a href="${STAGING_FRONTEND_URL}/sign-in?id=${options.id}""
                                style="background: #3F559E
                        ; display:block;color:#fff;padding:12px 10px; width: 220px; margin: 0 auto 0; box-shadow: none; border: 0; font-size: 15px; text-decoration: none; font-weight: 400; text-align: center;">Click here to log in</a>`
    } else {
        message += `    <a href="${STAGING_FRONTEND_URL}/organization""
                                style="background: #3F559E
                        ; display:block;color:#fff;padding:12px 10px; width: 220px; margin: 0 auto 0; box-shadow: none; border: 0; font-size: 15px; text-decoration: none; font-weight: 400; text-align: center;">Click here to log in</a>`
    }

    message += `</td>
                              
                          </tr>
  
  
  
                          <tr>
                              <td style="height:60px;">
                                <p> You are going to Love it here.</p>
                              </td>
                          </tr>
                         
                       
              
                     
                      </table>
                  </td>
              </tr>
          </tbody>
      </table>
  </body>
  
  </html>`;

    SmtpController.sendEmail(email, "Invitation", message);
};

const userVerifyLink = async (options) => {
    let email = options.email;
    message = "";

    message += `
  <!DOCTYPE html>
  <html>
  
  <head>
      <title>SafeSpots</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet">
  
  </head>
  
  <body style="font-family: 'Poppins', sans-serif; background : #F5F5F5;">
    <table width="100%" cellpadding:"0" cellspacing="0">
        <tbody>
            <tr>
                <td style="padding: 50px 20px;">
                    <table width="650px" cellpadding:"0" cellspacing="0" style="margin: 0 auto; background:#FFFEFD; "
                        class="w-100">
                        <tr>
                            <td style="height: 50px;">

                            </td>
                        </tr>
                   
                        <tr>
                            <td style="text-align:center; padding-bottom: 10px; height: 50px;">
                                 <img src="${BACK_WEB_URL}/static/logo.png"
                                style="width: 200px;object-fit: contain;margin: 0 auto;" />
                            </td>
                        </tr>
                       
                        <tr>
                            <td style="text-align:center; padding:3rem 0px; ">
                                 <img src="${BACK_WEB_URL}/static/Vector.png"
                                style="max-width: 300px;width: 100%;margin: 0px auto;" />
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="text-align:center;">
                                <p style="font-size: 20px;max-width: 400px;margin:0 auto;font-weight: bold;padding: 0 20px;color: #393C3D;line-height: 24px;margin-bottom: 0px;"
                                    class="fz-20">Hi ${options.firstName},
                                </p>
                            </td>
                        </tr>
                     

                        <tr>
                            <td style="padding: 15px 0 25px 0;">
                                <p
                                    style="font-size: 16px;max-width: 500px;margin:0 auto;text-align: center;color: #6D6D6D;line-height: 25px;padding: 0 20px;">
                                    Thanks for Signing Up at our platform. This is an notification <br> email and your otp for account verification is ${options.otp}<br>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="height:50px;">

                            </td>
                        </tr>
                       
                     
            
                   
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>
  
  </html>`;
    SmtpController.sendEmail(email, "Email Verification", message);
};

const updatePasswordEmail = (options) => {
    let email = options.email;
    let verificationCode = options.verificationCode;
    let fullName = options.fullName;
    userId = options.userId;

    if (!fullName) {
        fullName = email;
    }
    message = "";

    message += `
  <!DOCTYPE html>
  <html>
  
  <head>
      <title>SafeSpots</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet">
  
      <style>
          @media (max-width:767px) {
              .w-100 {
                  width: 100%;
              }
  
              .fz-20 {
                  font-size: 25px !important;
              }
          }
      </style>
  
  </head>
  
  <body style="font-family: 'Poppins', sans-serif; background:#fff;">
      <table width="100%" cellpadding:"0" cellspacing="0">
          <tbody>
              <tr>
                  <td style="padding: 50px 20px;">
                      <table width="676px" cellpadding:"0" cellspacing="0" style="margin: 0 auto; background:#F2F5FF
                      ;"
                          class="w-100">
                          <tr>
                              <td style="height:40px;">
  
                              </td>
                          </tr>
                     
                          <tr>
                              <td style="text-align:center; padding-bottom: 10px; height: 50px;">
                                  <img src="${BACK_WEB_URL}/static/logo.png"
                                  style="width: 120px; margin: 0 auto;" />
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 20px 60px;">
                                  <table width="100%;cellpadding:"0" cellspacing="0" ">
                                      <tr>
                                          <td style="border-bottom: 1px solid 
                              #E2E8F0; ">
  
                              </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td style="text-align:center; padding-bottom: 10px; ">
                                  <img src="${BACK_WEB_URL}/static/banner.png"
                                  style="width: 340px; margin: 0 auto;" />
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 20px 60px;">
                                  <table width="100%;cellpadding:"0" cellspacing="0" ">
                                      <tr>
                                          <td style="border-bottom: 1px solid 
                              #E2E8F0; ">
  
                              </td>
                                      </tr>
                                  </table>
                              </td>
                          </tr>
                          <tr>
                              <td style="text-align:center;">
                                  <p style="font-size:22px; max-width: 400px; margin:0 auto; font-weight: 600; padding: 0 20px; color: #384860; line-height: 24px;"
                                      class="fz-20">Hi ${options.fullName},
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 15px 0 25px 0;">
                                  <p
                                      style="font-size:16px; max-width: 400px; margin:0 auto; text-align: center; color: #6D6D6D; line-height: 25px; padding: 0 20px;">
                                      Your updated password is <b> ${options.password}</b>
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                  <a href="#"
                                      style="background: #3F559E
                              ; display:block;color:#fff;padding:12px 10px; width: 220px; margin: 0 auto 0; box-shadow: none; border: 0; font-size: 15px; text-decoration: none; font-weight: 400; text-align: center;">Verify your email address</a>
                              </td>
                          </tr>
  
  
  
                          <tr>
                              <td style="height:60px;">
  
                              </td>
                          </tr>
                         
                       
              
                     
                      </table>
                  </td>
              </tr>
          </tbody>
      </table>
  </body>
  
  </html>`;

    SmtpController.sendEmail(email, "Password Update", message);
};

const verificationOtp = (options) => {
    let email = options.email;
    let fullName = options.firstName ? options.firstName : options.fullName;
    userId = options.userId;

    if (!fullName) {
        fullName = email;
    }
    message = "";


    message += `
  <!DOCTYPE html>
<html>

<head>
    <title> SafeSpots</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">

</head>

<body style="font-family: 'Poppins', sans-serif; background : #f3f3f3;">
    <table width="100%" cellpadding:"0" cellspacing="0">
        <tbody>
            <tr>
                <td style="padding: 50px 20px;">
                    <table width="676px" cellpadding:"0" cellspacing="0" style="margin: 0 auto; background:#fff; "
                        class="w-100">
                        <tr>
                            <td style="height: 28px;">

                            </td>
                        </tr>
                   
                        <tr>
                            <td style="text-align:center; padding-bottom: 10px; height: 50px;">
                                <img src="${BACK_WEB_URL}/static/logo.png"
                                style="width: 150px;object-fit: contain;margin: 0 auto;" />
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 60px;">
                                <table width="100%;cellpadding:"0" cellspacing="0" ">
                                    <tr>
                                        <td style="border-bottom: 1px solid 
                            #E2E8F0; ">

                            </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:center; padding-bottom: 10px; ">
                                <img src="${BACK_WEB_URL}/static/Vector.png"
                                style="max-width: 278px;width: 100%;margin: 15px auto;" />
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 60px;">
                                <table width="100%;cellpadding:"0" cellspacing="0" ">
                                    <tr>
                                        <td style="border-bottom: 1px solid 
                            #E2E8F0; ">

                            </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:center;">
                                <p style="font-size: 20px;max-width: 400px;margin:0 auto;font-weight: bold;padding: 0 20px;color: #393C3D;line-height: 24px;margin-bottom: 0px;"
                                    class="fz-20">Hi ${fullName},
                                </p>
                            </td>
                        </tr>
                     

                        <tr>
                            <td style="padding: 15px 0 25px 0;">
                                <p
                                    style="font-size: 16px;max-width: 500px;margin:0 auto;text-align: center;color: #6D6D6D;line-height: 25px;padding: 0 20px;">
                                    Your otp for account verification is ${options.otp} 
                                </p>
                            </td>
                        </tr>
                        <tr>`



    message += `</tr>



                        <tr>
                            <td style="height:60px;">

                            </td>
                        </tr>
                       
                     
            
                   
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>

</html>`

    SmtpController.sendEmail(email, "Account Verification otp", message);
};


module.exports = {
    forgotPasswordEmail,
    add_user_email,
    userVerifyLink,
    updatePasswordEmail,
    invite_user_email,
    verificationOtp
};
