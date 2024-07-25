import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { convert } from "html-to-text";

import nodemailer from "nodemailer";
import pug from "pug";

const __dirname = dirname(fileURLToPath(import.meta.url));

/// Use case =>  new Email(user, url).sendWelcome();

export default class Email {
   constructor(user, url) {
      this.to = user.email;
      this.firstName = user.name.split(" ")[0];
      this.url = url;
      this.from = `Sumanth M Devadiga <${process.env.EMAIL_FROM}>`;
   }

   // Creating transporter of "Nodemailer"
   newTransport() {
      /// 1. For production => emails to actual email id's using "SENDGRID"
      if (process.env.NODE_ENV === "production") {
         return nodemailer.createTransport({
            host: process.env.MAILGUN_HOST,
            port: process.env.MAILGUN_PORT,
            secure: false,
            auth: {
               user: process.env.MAILGUN_USERNAME,
               pass: process.env.MAILGUN_PASSWORD,
            },
         });
      }

      /// 2. For development => emails to "Mailtrap"
      return nodemailer.createTransport({
         host: process.env.EMAIL_HOST,
         port: process.env.EMAIL_PORT,
         secure: false,
         auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
         },
      });
   }

   // Sending emails
   async send(template, subject) {
      ///1. Render HTML, based on PUG template
      const html = pug.renderFile(
         `${__dirname}/../views/emails/${template}.pug`,
         {
            url: this.url,
            firstName: this.firstName,
            subject,
         }
      );

      ///2. Define the email options
      const mailOptions = {
         from: this.from,
         to: this.to,
         subject,
         html,
         text: convert(html),
      };

      ///3. Create a transport and send email
      await this.newTransport().sendMail(mailOptions);
   }

   async sendWelcome() {
      await this.send("welcome", "Welcome to the Natours Family");
   }

   async sendPasswordReset() {
      await this.send(
         "passwordReset",
         "Your password reset token(Valid for only 10 minutes)"
      );
   }
}
