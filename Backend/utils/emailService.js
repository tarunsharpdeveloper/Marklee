const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendOTP(email, otp) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification OTP',
        html: `
           <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin-top: 20px;">
              <!-- Logo Header -->
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://i.ibb.co/ZR2nKnwd/image-3.png" alt="Company Logo" style="max-height: 60px; margin-bottom: 20px;">
                <div style="width: 100%; height: 2px; background: linear-gradient(to right, #4CAF50, #45a049); margin: 20px 0;"></div>
              </div>

              <!-- Content -->
              <div style="text-align: center; padding: 20px;">
                <h2 style="color: #333; margin-bottom: 15px; font-size: 24px;">Email Verification Code</h2>
                <p style="color: #666; margin-bottom: 25px; font-size: 16px;">Use the following OTP to verify your email address</p>
                
                <!-- OTP Box -->
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 25px 0;">
                  <h1 style="color:#af4c4c; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
                </div>

                <p style="color: #999; font-size: 14px; margin-top: 25px;">This code will expire in 10 minutes</p>
                
                <!-- Security Notice -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #666; font-size: 13px;">If you didn't request this verification code, please ignore this email or contact support if you have concerns.</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Marklee. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

module.exports = new EmailService(); 