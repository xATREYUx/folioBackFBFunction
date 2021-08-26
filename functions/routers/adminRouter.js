const router = require("express").Router();
const admin = require("firebase-admin");
const auth = require("../middleware/auth");

router.post("/", auth, (req, res) => {
  console.log("---adminRouter post---", req.user.email);
  admin
    .auth()
    .getUserByEmail(req.user.email)
    .then((user) => {
      console.log("getUserByEmail: ", user);

      return admin.auth().setCustomUserClaims(user.uid, {
        admin: true,
      });
    })
    .then(() => {
      console.log(req.user);
      //   res.json(req.user);
      return {
        message: `Success! ${req.user.email} has been made an admin`,
      };
    })
    .catch((err) => {
      return err;
    });
});

module.exports = router;
