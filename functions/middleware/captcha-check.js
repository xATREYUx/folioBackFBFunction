const axios = require("axios");

const captchaCheck = async (req, res, next) => {
  console.log("captchaCheck Started");
  let environment = process.env.NODE_ENV || "development";

  let serverKey;
  if (environment == "development") {
    serverKey = process.env.RECAPTCHA_SERVER_KEY_DEVELOPMENT;
  } else {
    serverKey = process.env.RECAPTCHA_SERVER_KEY;
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log("server key", serverKey);
    await axios
      .post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${serverKey}&response=${token}`
      )
      .then((captchaRes) => {
        console.log("captchaRes: ", captchaRes.data["success"]);
        req.captcha = captchaRes.data["success"];
      })
      .catch((err) => {
        throw new Error(`Error in Google Siteverify API. ${err.message}`);
      });

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({
      errorMessage: "Not Human",
    });
  }
};
module.exports = captchaCheck;
