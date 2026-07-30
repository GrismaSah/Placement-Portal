export const  NewJobPostedNotificationTemplate = (doc, studentName) =>{
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; padding: 20px;">
            <tr>
              <td align="center" style="padding: 10px 0;">
                <h1 style="color: #007bff;">NITA Placement Cell</h1>
              </td>
            </tr>
            <tr>
              <td>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  Dear ${studentName},
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  A new job opportunity has been posted! Below are the job details:
                </p>
                <ul style="font-size: 16px; line-height: 1.5; color: #333; list-style: none; padding: 0;">
                  <li><strong>Title:</strong> ${doc.title}</li>
                  <li><strong>Description:</strong> ${doc.description}</li>
                  <li><strong>Category:</strong> ${doc.category}</li>
                  <li><strong>Company:</strong> ${doc.company}</li>
                  <li><strong>Location:</strong> ${doc.city}, ${doc.country}</li>
<li> <strong>Salary:</strong> ${doc.fixedSalary ? `Fixed: ${doc.fixedSalary}` : `${doc.salaryFrom ? doc.salaryFrom : "N/A"} - ${doc.salaryTo ? doc.salaryTo : "N/A"}`}</li>
                  <li><strong>Posted On:</strong> ${new Date(doc.jobPostedOn).toLocaleDateString()}</li>
                </ul>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                  Visit the NITA Placement Cell portal for more details and to apply.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px;">
                <a href="${process.env.PLACEMENT_WEBSITE_URL}" 
                   style="display: inline-block; font-size: 16px; color: #ffffff; background-color: #007bff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  View Job Details
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <p style="font-size: 16px; line-height: 1.5; color: #666;">
                  Best regards,<br>
                  NITA Placement Cell Team
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }  