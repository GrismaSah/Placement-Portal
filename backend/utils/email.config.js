import nodemailer from 'nodemailer';
import { config } from "dotenv";
config({ path: ".env" });

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