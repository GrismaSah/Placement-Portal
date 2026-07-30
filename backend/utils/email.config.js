import nodemailer from 'nodemailer';
import { config } from "dotenv";
config({ path: ".env" });
// console.log("email :",process.env.NODEMAIL_EMAIL);
// console.log(process.env.NODEMAIL_PASSWORD);

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.NODEMAIL_EMAIL,
      pass: process.env.NODEMAIL_PASSWORD,
    },
});

export default transporter;