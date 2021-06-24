const router = require("express").Router();
const axios = require("axios");

const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors")({
  origin: true,
});
const gmailEmail = functions.config().email;
const gmailPassword = functions.config().password;

const mailTransport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

router.post("/", async (req, res) => {
  console.log("contact router fired req.body", req.body);

  if (req.method === "OPTIONS") {
    res.end();
  } else {
    try {
    cors(req, res, () => {
      if (req.method !== "POST") {
        return;
      }

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
    });
  } catch (err) {
      console.log(err)
    }
  }
});
module.exports = router;
