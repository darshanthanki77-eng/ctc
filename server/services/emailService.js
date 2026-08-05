const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT ? process.env.SMTP_PORT === '465' : true,
  auth: {
    user: process.env.SMTP_USER || 'Sharmakhushbu1977@gmail.com',
    pass: process.env.SMTP_PASS || 'krjh xjpr kiul gkdc',
  },
});

if (!process.env.SMTP_PASS) {
  console.warn('WARNING: SMTP_PASS is not set in environment variables. Email sending may fail.');
}

const sendWelcomeEmail = async (email, fullName, userId, password) => {
  const mailOptions = {
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'Sharmakhushbu1977@gmail.com'}>`,
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
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'Sharmakhushbu1977@gmail.com'}>`,
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
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'Sharmakhushbu1977@gmail.com'}>`,
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

const sendAdminDepositNotification = async (depositRequest, user, pkg) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'Sharmakhushbu1977@gmail.com';
  const mailOptions = {
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'Sharmakhushbu1977@gmail.com'}>`,
    to: adminEmail,
    subject: `⚠️ New Deposit Request - User: ${user.userId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #FF9800; text-align: center;">New Deposit/Manual Buy Request</h2>
        <p>A user has submitted a new manual package purchase (deposit request) that requires admin review.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Requester User ID:</strong> ${depositRequest.userId}</p>
          <p><strong>Target User ID:</strong> ${depositRequest.targetUserId || user.userId}</p>
          <p><strong>Package Name:</strong> ${pkg.name}</p>
          <p><strong>Amount:</strong> $${depositRequest.amount}</p>
          <p><strong>Network Type:</strong> ${depositRequest.networkType}</p>
          <p><strong>Transaction Hash:</strong> <span style="word-break: break-all;">${depositRequest.txHash}</span></p>
          <p><strong>USDT Amount (100% or 50% split):</strong> $${depositRequest.amount - depositRequest.walletAmountPaid}</p>
          <p><strong>Wallet Amount Split:</strong> $${depositRequest.walletAmountPaid}</p>
          <p><strong>Status:</strong> Pending Approval</p>
        </div>
        <p>Please log in to the admin panel to approve or reject this request.</p>
        <br />
        <p>Best Regards,<br />The CTC Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin deposit notification sent successfully to:', adminEmail);
  } catch (error) {
    console.error('Error sending admin deposit notification:', error);
  }
};

const sendAdminWithdrawalNotification = async (withdrawalRequest, user) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'Sharmakhushbu1977@gmail.com';
  const mailOptions = {
    from: `"CTC Platform" <${process.env.FROM_EMAIL || 'Sharmakhushbu1977@gmail.com'}>`,
    to: adminEmail,
    subject: `⚠️ New Withdrawal Request - User: ${user.userId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #E91E63; text-align: center;">New Withdrawal Request</h2>
        <p>A user has submitted a new withdrawal request that requires admin review.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>User ID:</strong> ${withdrawalRequest.userId}</p>
          <p><strong>Amount Requested:</strong> $${withdrawalRequest.amount}</p>
          <p><strong>Deduction Fee (10%):</strong> $${withdrawalRequest.deduction}</p>
          <p><strong>Final Release Amount:</strong> $${withdrawalRequest.finalAmount}</p>
          <p><strong>Receiver Wallet Address:</strong> <span style="word-break: break-all;">${withdrawalRequest.walletAddress}</span></p>
          <p><strong>Withdrawal Type:</strong> ${withdrawalRequest.type}</p>
          <p><strong>Status:</strong> Pending Approval</p>
        </div>
        <p>Please log in to the admin panel to approve or reject this request.</p>
        <br />
        <p>Best Regards,<br />The CTC Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin withdrawal notification sent successfully to:', adminEmail);
  } catch (error) {
    console.error('Error sending admin withdrawal notification:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendWithdrawalApprovedEmail,
  sendPasswordResetEmail,
  sendAdminDepositNotification,
  sendAdminWithdrawalNotification,
};
