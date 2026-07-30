export const Register_Successful_Template = (doc) => `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border: 1px solid #ccc; border-radius: 10px;">
        <h2 style="text-align: center; color: #4CAF50;">Registered Successfully!</h2>
        <p>Dear <strong>${doc?.firstname || doc?.name}</strong>,</p>
        <p>We are thrilled to inform you that your account has been successfully created! You can now access all our features and resources.</p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <p style="text-align: center;">
          <a href="${process.env.APP_URL}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        <p>Best Regards,</p>
        <p><strong>Team NITA Placement Cell</strong></p>
        <p style="font-size: 12px; text-align: center; color: #aaa;">This is an automated email. Please do not reply.</p>
      </div>
    </body>
  </html>
`;