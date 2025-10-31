import { createTransport } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Email Service for sending appointment notifications
 * Uses nodemailer with SMTP configuration from .env
 */

// Create reusable transporter - check if SMTP credentials are configured
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("✅ Email service configured successfully");
  } catch (error) {
    console.warn("⚠️  Email service configuration failed:", error.message);
  }
} else {
  console.warn("⚠️  Email service not configured - SMTP credentials missing in .env");
}

/**
 * Send appointment confirmation email
 */
export const sendAppointmentConfirmation = async (appointmentData) => {
  const {
    customerEmail,
    customerName,
    appointmentId,
    date,
    startTime,
    endTime,
    serviceType,
    vehicleMake,
    vehicleModel,
  } = appointmentData;

  const mailOptions = {
    from: `"AutoService" <${process.env.SMTP_USER}>`,
    to: customerEmail,
    subject: "Appointment Confirmation - AutoService",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
          .detail-label { font-weight: bold; color: #6c757d; }
          .detail-value { color: #212529; }
          .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
          .button { background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed!</h1>
            <p>Your service appointment has been successfully booked</p>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Thank you for choosing AutoService. Your appointment has been confirmed with the following details:</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Appointment ID:</span>
                <span class="detail-value">#${appointmentId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${startTime} - ${endTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${serviceType.replace(/_/g, " ").toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span class="detail-value">${vehicleMake} ${vehicleModel}</span>
              </div>
            </div>
            
            <p><strong>Important Information:</strong></p>
            <ul>
              <li>Please arrive 10 minutes early</li>
              <li>Bring your vehicle registration and insurance</li>
              <li>If you need to cancel, please do so at least 24 hours in advance</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>AutoService - Your Trusted Auto Repair Partner</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (!transporter) {
      console.warn("⚠️  Email not sent - transporter not configured");
      return { success: false, error: "Email service not configured" };
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Confirmation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send appointment cancellation email
 */
export const sendAppointmentCancellation = async (appointmentData) => {
  const {
    customerEmail,
    customerName,
    appointmentId,
    date,
    startTime,
    serviceType,
    cancellationReason,
  } = appointmentData;

  const mailOptions = {
    from: `"AutoService" <${process.env.SMTP_USER}>`,
    to: customerEmail,
    subject: "Appointment Cancelled - AutoService",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your appointment #${appointmentId} scheduled for ${date} at ${startTime} (${serviceType.replace(/_/g, " ")}) has been cancelled.</p>
            
            ${cancellationReason ? `<div class="details"><strong>Reason:</strong> ${cancellationReason}</div>` : ""}
            
            <p>You can book a new appointment anytime through your dashboard.</p>
            <p>We hope to serve you again soon!</p>
          </div>
          <div class="footer">
            <p>AutoService - Your Trusted Auto Repair Partner</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (!transporter) {
      console.warn("⚠️  Email not sent - transporter not configured");
      return { success: false, error: "Email service not configured" };
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Cancellation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending cancellation email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email transporter configuration
 */
export const verifyEmailConfig = async () => {
  if (!transporter) {
    console.warn("⚠️  Email service not configured");
    return false;
  }
  
  try {
    await transporter.verify();
    console.log("✅ Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("❌ Email server configuration error:", error);
    return false;
  }
};
