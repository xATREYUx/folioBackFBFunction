const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors")({
  origin: true,
});
const gmailEmail = functions.config().email;
const gmailPassword = functions.config().password;

const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

exports.submit = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.end();
  } else {
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
  }
});

exports.app = functions.https.onRequest(app);


// import firebase from "firebase/app"; // doing import firebase from 'firebase' or import * as firebase from firebase is not good practice.
// import "firebase/auth";
// import "firebase/database";
// import "firebase/firestore";
// import Axios from "axios";

// // Initialize Firebase
// let config = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
//   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
// };

// firebase.initializeApp(config);

// const db = firebase.firestore();

// export { Axios, db };

//CredentialsContainer.JSON
// {
//   "type": "service_account",
//   "project_id": "devport-express-backend",
//   "private_key_id": "10fe04fda2f93e49b4686c7bbdb00b9c078798c2",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAyKaAZA2v/BKl\njs9ovqi9Lv2yAjK4snJQcQC+yeaqUPMmvLAdnCuW5wd2NGY+fCY4zAUKVvT/M65M\nVWhKwcvjPOCcUs1vgYkfhpLm2MpCQK1sTKxWFu1+zhl1ctB0FM4rppUcUOMqyvTU\n8nWWBHDH30G/0ksfHrggwas9dHQlVfrE5Otec2I52bHAJWLC0AgnWk2v0G4Jf67V\nlSqrirM6f52dr/AUXJoJNwYkwgRRggR0lTtW9+YUbKTJxP9dWM8hO6QnKe9gbQZy\naNbbSbfkaD8NGmFBiDrgBTuVT3kxYvvw/WbUY1xzEqnAnBw0vTt8e5CbrgbD6Zjq\n2dJjBrVzAgMBAAECggEAPkPQOyGVpiRlJWHFrY/+0fOObuL03OCNuVt2ISj2vkWc\n8wL4Yufg0EFYEJ6F82KHucpzSk6hnJdlkTP4lkSXhJJR/UtlHMGatzrw0Wxtjw5y\ntMri0n9fP5hzcpKdrxBVMpYADQA3Dsg0YV7aCZTvlC6QftL9/lQepj3G//dP2Aqn\n33zTTHdhBIfGo/rTEDjriWJ2tSQ3C8RRJllsoq0RyAM81VmCuMtsxq2uLZp7aUJL\nJE2OBL7syyrEL7AkWzkdQzhZk5UjloBSY9VaLGCALdivBBHOy3ck0TvJAKP35Oid\noaMbsstxpEzKaTvoZ/2Cz7Rma5EKDh+5zG43t1oiYQKBgQD033PZRJciFBg3Wcy2\nc1XUkhnQqcIi+ocfl/yE/PQrxAxHdZGlqbwykQHDTlPFm2Exv3KDqMiw4RI3S++H\niPNf9Zk5avVPrp7eWgUL25WHizwNNNTqWUJJYM4n6U2skClgUVsoALMXdVeS7NgT\ndS7VdNtSR255P3dcY6XmyCLsAwKBgQDJi0IWQgeHvBcj1O5W6XyAmIeKj9v0V7Of\nf9eGj+iI+Ta++IwbJfcpaZe13PEFOvm91nJtWGBEkkMzzu8q/XypWiEuArHPUGxQ\nqF0LVOmBgkt/FPyiXvSOsa1nk7W+cdVaC5QaZmozswsVl+IOe3ExdyIAbk5P+seM\n8PSFLwKt0QKBgQCfkSTaxdl+OX32Q6wkkE+z72inEpgRVxPKQK4qsvMhueUOg8xf\nGZYrlVaCwH3SXQge9NRYexocOO433mG9/j4pn88zHUGxpOadmieDrJlp9A8zw+Oi\nunt5eX2dgGg/NMnhm+I81QffF3Xzpia/tzLHohhxK18P342WRNEM7AnlpQKBgEG5\nhCe2CLafA/zPZ5o4Mj3NgAYTu+sG3rDZA/QB4hcpDk1gyG/iBaQfpzXLg13tSZw6\n3r4B4AL8n6W5ig0+9PRVTBSxFENDOs9i2FTlr/BoCS68LVbWGHKgRqhMZyxf+u+O\nbxHc7C1H6gl0qmeGofc7nn79edRjN8gim9sC5aDBAoGAeHF3sXsgSumjDL1/xJZg\nsDnHlCAlZHRNPPK/eLAAWVsBO4muEQhjXBKyv+JxhuxHodwdJpE2x+R/ak5pJDGN\nO7q4q2tCK2d3yCjk/1lhsS61mphZfikXs64F6qno0f/h5/XfM0GJjBwPzXXNHKRk\n+yWhCjzj/wOa3sydSq1QBTs=\n-----END PRIVATE KEY-----\n",
//   "client_email": "express-apis@devport-express-backend.iam.gserviceaccount.com",
//   "client_id": "112402897339442144676",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/express-apis%40devport-express-backend.iam.gserviceaccount.com"
// }
