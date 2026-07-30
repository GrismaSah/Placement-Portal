export const DeclineTnpRequestTemplate = (tnpName) => {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; padding: 20px;">
            <tr>
              <td align="center" style="padding: 10px 0;">
                <h1 style="color: #d9534f;">NITA Placement Cell</h1>
              </td>
            </tr>
            <tr>
              <td>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  Dear ${tnpName},
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  We regret to inform you that your recent request to the Training and Placement Office has been declined. Please reach out to us for further assistance.
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  If you have any questions or require further clarification, feel free to contact the TPO.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Best regards,<br>
                  NITA Training and Placement Office
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  };

  

  export const ApprovalTnpRequestTemplate = (tnpName) => {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; padding: 20px;">
            <tr>
              <td align="center" style="padding: 10px 0;">
                <h1 style="color: #5cb85c;">NITA Placement Cell</h1>
              </td>
            </tr>
            <tr>
              <td>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  Dear ${tnpName},
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  We are pleased to inform you that your recent request to the Training and Placement Office has been approved. You may now proceed with the necessary steps.
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  If you have any questions or need further assistance, feel free to contact the TPO.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Best regards,<br>
                  NITA Training and Placement Office
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  };  