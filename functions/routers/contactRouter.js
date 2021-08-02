const router = require("express").Router();
const axios = require("axios");

const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const captchaCheck = require("../middleware/captcha-check");

const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

router.post("/", captchaCheck, async (req, res) => {
  console.log("contact router fired");
  // console.log("captchaCheck result", captchaCheck);

  if (req.method === "OPTIONS") {
    console.log("res.end - method was 'OPTIONS'");
    res.end();
  } else {
    try {
      if (req.method !== "POST") {
        console.log("return - method was a post request");
        return;
      }
      if (req.captcha !== true) {
        console.log("Prove you're human.");
        return;
      }
      const mailTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail,
          pass: "F7974639s!",
        },
      });

      const mailOptions = {
        from: req.body.email,
        replyTo: req.body.email,
        to: gmailEmail,
        subject: `${req.body.name} just messaged me from my website`,
        text: req.body.message,
        html: `<p>${req.body.message}</p>`,
      };

      return mailTransport.sendMail(mailOptions).then(() => {
        console.log("New email sent to:", gmailEmail);
        res.status(200).send({
          isEmailSend: true,
        });
        return;
      });
    } catch (err) {
      console.log("create contact error", err);
    }
  }
});
module.exports = router;
