const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendWelcomeEmail = async (email, fullName, userId, password) => {
  const mailOptions = {
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'trustx46@gmail.com'}>`,
    to: email,
    subject: 'Welcome to CTC - Registration Successful',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #A020F0; text-align: center;">Welcome to CTC Platform!</h2>
        <p>Dear ${fullName},</p>
        <p>Congratulations! Your registration on the CTC Platform was successful. Below are your account details:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Username / Referral ID:</strong> ${userId}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>You can now log in to your dashboard and start exploring the features of CTC.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br />
        <p>Best Regards,<br />The CTC Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendWithdrawalApprovedEmail = async (email, fullName, amount, txHash) => {
  const mailOptions = {
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'trustx46@gmail.com'}>`,
    to: email,
    subject: 'Withdrawal Approved - CTC Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Withdrawal Approved!</h2>
        <p>Dear ${fullName},</p>
        <p>Your withdrawal request on the CTC Platform has been approved. The details are below:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${amount}</p>
          <p><strong>Transaction Hash:</strong> <span style="word-break: break-all;">${txHash}</span></p>
          <p><strong>Status:</strong> Approved & Released</p>
        </div>
        <p>If you have any questions or did not authorize this, please contact support immediately.</p>
        <br />
        <p>Best Regards,<br />The CTC Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Withdrawal approval email sent to:', email);
  } catch (error) {
    console.error('Error sending withdrawal approval email:', error);
  }
};

const sendPasswordResetEmail = async (email, fullName, resetUrl) => {
  const mailOptions = {
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'trustx46@gmail.com'}>`,
    to: email,
    subject: 'Password Reset Request - CTC Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #A020F0; text-align: center;">Reset Your Password</h2>
        <p>Dear ${fullName},</p>
        <p>You requested to reset your password. Please click the button below to set a new password. This link is valid for 1 hour:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #A020F0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #555;">${resetUrl}</p>
        <p>If you did not request this reset, please ignore this email.</p>
        <br />
        <p>Best Regards,<br />The CTC Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendWithdrawalApprovedEmail,
  sendPasswordResetEmail,
};
