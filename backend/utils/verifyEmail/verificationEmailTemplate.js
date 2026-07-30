export const Verification_Email_Template = `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4CAF50;">Welcome to NITA Placement Cell</h2>
      <p>Dear User,</p>
      <p>Thank you for registering with us. To complete your registration, please verify your email address by entering the following verification code:</p>
      <h3 style="color: #4CAF50; font-size: 24px;">{verificationCode}</h3>
      <p>If you did not request this email, please ignore it.</p>
      <br />
      <p>Best Regards,</p>
      <p>The NITA Placement Cell Team</p>
      <footer style="margin-top: 30px; font-size: 12px; color: #777;">
        <p>For any issues, contact us at <a href="mailto:support@nita-placements.com">support@nita-placements.com</a></p>
      </footer>
    </body>
  </html>
`;