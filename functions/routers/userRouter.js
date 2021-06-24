const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const admin = require("firebase-admin");
const db = admin.firestore();

router.post("/", async (req, res) => {
  console.log("---User signup initiated---");

  try {
    const { tokenId } = req.body;
    console.log("tokenId passed from frontend: ", tokenId);
    admin
      .auth()
      .verifyIdToken(tokenId)
      .then((decodedToken) => {
        const { email, uid } = decodedToken;
        console.log("Fetched UID: ", uid);
        console.log("Fetched email: ", email);
        const Users = db.collection("users");
        Users.doc(`${uid}`).set({
          email: email,
          posts: [],
        });
        console.log("---jwt signing initiated---");

        const token = jwt.sign(
          {
            user: { email, uid },
          },
          process.env.JWT_SECRET
        );
        console.log("token log: ", token);

        return res
          .cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
          })
          .send();
      });
  } catch (err) {
    console.log(err);
  }
});

router.get("/logout", (req, res) => {
  console.log("Logout Initiated");

  try {
    res
      .cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
      })
      .send();
  } catch (err) {
    console.log("err", err);
  }
});

router.get("/loggedIn", (req, res) => {
  console.log("login validation initiated");
  try {
    const token = req.cookies.token;
    if (!token) {
      console.log("no token cookie");
      return res.json(null);
    }

    console.log("Token Creation Initiated");
    const validatedUser = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token cookie: ", validatedUser);

    res.json(validatedUser);
  } catch (err) {
    console.log("loggedIn", err);
  }
});

module.exports = router;
