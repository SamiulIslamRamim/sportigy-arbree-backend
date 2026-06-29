import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: `"Sportigy | NO-REPLY" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your Sportigy account",
    html: `
      <h2>Welcome to Sportigy!</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 8px;">${otp}</h1>
      <p>This code expires in <strong>3 minutes</strong>.</p>
      <p>If you did not register, ignore this email.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: `"Sportigy" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset your Sportigy password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Your OTP to reset your password is:</p>
      <h1 style="letter-spacing: 8px;">${otp}</h1>
      <p>This code expires in <strong>5 minutes</strong>.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });
};