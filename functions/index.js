const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const functions = require("firebase-functions");
const admin = require("firebase-admin");

dotenv.config();

admin.initializeApp({
  // credential: admin.credential.cert(serviceAccount),
  // databaseURL: "https://devport-express-backend.firebaseio.com",
  storageBucket: "devport-express-backend.appspot.com",
});

if (process.env.NODE_ENV == "development") {
  process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
}

const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});

// app.use(express.json());
// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use("/auth", require("./routers/userRouter"));
app.use("/posts", require("./routers/postRouter"));
app.use("/contacts", require("./routers/contactRouter"));

exports.app = functions.https.onRequest(app);
