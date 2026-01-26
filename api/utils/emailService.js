const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
const sendEmail = async (to, subject, html, text = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Office Pantry System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
const sendOrderConfirmation = async (userEmail, orderDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Order Confirmation</h2>
      <p>Dear Customer,</p>
      <p>Thank you for your order with Office Pantry System!</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333;">Order Details:</h3>
        <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount.toFixed(2)}</p>
        <p><strong>Status:</strong> ${orderDetails.orderStatus}</p>
      </div>
      
      <p>You can track your order status in the Office Pantry System dashboard.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p>Best regards,</p>
        <p><strong>Office Pantry Management Team</strong></p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, `Order Confirmation - ${orderDetails.orderNumber}`, html);
};

// Send low stock alert email
const sendLowStockAlert = async (adminEmail, itemDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ff6b6b; border-radius: 10px;">
      <h2 style="color: #ff6b6b;">⚠️ Low Stock Alert</h2>
      <p>Attention: Inventory Manager</p>
      
      <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333;">Item Details:</h3>
        <p><strong>Item Name:</strong> ${itemDetails.name}</p>
        <p><strong>Current Stock:</strong> ${itemDetails.quantity} units</p>
        <p><strong>Minimum Stock Level:</strong> ${itemDetails.minStockLevel} units</p>
        <p><strong>Category:</strong> ${itemDetails.category}</p>
        <p><strong>Status:</strong> <span style="color: #ff6b6b; font-weight: bold;">LOW STOCK</span></p>
      </div>
      
      <p style="color: #d32f2f;">Please restock this item as soon as possible to avoid stockout.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p>This is an automated alert from Office Pantry System.</p>
      </div>
    </div>
  `;

  return await sendEmail(adminEmail, `Low Stock Alert - ${itemDetails.name}`, html);
};

// Send registration confirmation email
const sendRegistrationEmail = async (userEmail, userDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #4CAF50; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Welcome to Office Pantry System!</h2>
      <p>Dear ${userDetails.name},</p>
      
      <div style="background-color: #f1f8e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333;">Your Account Details:</h3>
        <p><strong>Employee ID:</strong> ${userDetails.employeeId}</p>
        <p><strong>Email:</strong> ${userDetails.email}</p>
        <p><strong>Department:</strong> ${userDetails.department}</p>
        <p><strong>Role:</strong> ${userDetails.role}</p>
      </div>
      
      <p>Your account has been successfully created. You can now:</p>
      <ul>
        <li>Browse items in the pantry</li>
        <li>Place orders</li>
        <li>Manage your wallet</li>
        <li>View order history</li>
      </ul>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p>If you have any questions, please contact the pantry administrator.</p>
        <p>Best regards,</p>
        <p><strong>Office Pantry Management Team</strong></p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, 'Welcome to Office Pantry System', html);
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendLowStockAlert,
  sendRegistrationEmail
};
