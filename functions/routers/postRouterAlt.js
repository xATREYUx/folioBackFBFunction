const router = require("express").Router();
const { check } = require("express-validator");

const auth = require("../middleware/auth");

const admin = require("firebase-admin");
const bucket = admin.storage().bucket();
const db = admin.firestore();

const axios = require("axios");

const uploader = require("../middleware/file-upload");
const { v4: uuidv4 } = require("uuid");

const Posts = db.collection("posts");
const Users = db.collection("users");

// new
router.post(
  "/",
  auth,
  uploader.fields([
    { name: "cardImage", maxCount: 1 },
    { name: "postImageOne", maxCount: 1 },
    { name: "postImageTwo", maxCount: 1 },
  ]),
  [
    check("title").not().isEmpty(),
    check("caption").not().isEmpty(),
    check("content").not().isEmpty(),
  ],
  async (req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    // console.log("createPost req.user", req.user);
    console.log("createPost req.files", req.files);
    const { title, caption, content } = req.body;
    console.log("createPost req.body.title", title);

    const { uid } = req.user;

    //add images to storage
    try {
      const blobWriterAsync = (value, key) =>
        console.log("---blobWriterAsync Initiated---");
      new Promise((resolve, reject) => {
        let token = uuidv4();
        const fileName = value[0].originalname + "-" + Date.now();
        const blob = bucket.file(fileName);

        const blobWriter = blob.createWriteStream({
          metadata: {
            contentType: value[0].mimetype,
            metadata: {
              firebaseStorageDownloadTokens: token,
            },
          },
        });

        blobWriter.on("error", (err) => reject(err));
        blobWriter.on("finish", () => {
          console.log("---Assemblying Public URL & Metadata---", blob.name);

          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/${encodeURI(blob.name)}?alt=media`;
          resolve({ [key]: publicUrl });
        });
        blobWriter.end(value[0].buffer);
      });

      const imagesWriteFunction = async () => {
        console.log("---imagesWriteFunction Initiated---");

        var urls = [];

        for (const [key, value] of Object.entries(req.files)) {
          try {
            const url = await blobWriterAsync(value, key);
            urls.push(url);
          } catch (err) {
            console.log("blob write error");
          }
        }
        return urls;
      };

      await imagesWriteFunction()
        .then(async (urls) => {
          console.log("imagesWriteFunction urls log", urls);

          // console.log("iamgeUrls log", iamgeUrls);
          //adds post to Post collection in firestore
          var newPostData = {
            title,
            caption,
            content,
            creator: uid,
            created: admin.firestore.Timestamp.now().seconds,
            postURLs: urls,
          };

          const newPostRes = await Posts.add(newPostData);
          console.log("---newPostRes---", newPostRes.id);
          newPostData.id = newPostRes.id;
          //start 5 minute google function delete timer
          // const cleanId = newPostRes.id;
          // try {
          //   axios
          //     .post(
          //       "https://us-central1-devport-express-backend.cloudfunctions.net/clean",
          //       { cleanId }
          //     )
          //     // .then((data) => console.log("function data response", data))
          //     .then((data) => console.log("function data response"))

          //     .catch((err) => {
          //       console.log("function log", err);
          //     });
          // } catch (err) {
          //   console.log("function log err", err);
          // }

          //adds post id to users posts array
          const unionRes = await Users.doc(uid).update({
            posts: admin.firestore.FieldValue.arrayUnion(newPostRes.id),
          });
          console.log("---Successfully added to user posts array---", unionRes);
          res.status(200).send(newPostData);
        })
        .catch((err) => console.log("createPost error", err));
    } catch (err) {
      console.log(err);
    }
  }
);
// router.post("/", auth, async (req, res) => {
//   console.log("req.body", req.body);
//   console.log("req.user", req.user);

//   const { title, caption, content } = req.body;
//   const { uid } = req.user;

//   try {
//     console.log("---createPost Initiated---");
//     var newPostData = {
//       title,
//       caption,
//       content,
//       creator: uid,
//       created: admin.firestore.Timestamp.now().seconds,
//     };
//     //adds post to Post collection in firestore
//     const newPostRes = await Posts.add(newPostData);
//     console.log("---newPostRes---", newPostRes.id);
//     newPostData.id = newPostRes.id;
//     //adds post id to users posts array
//     const unionRes = await Users.doc(uid).update({
//       posts: admin.firestore.FieldValue.arrayUnion(newPostRes.id),
//     });
//     console.log("---Successfully added to user posts array---", unionRes);
//     res.json(newPostData);
//   } catch (err) {
//     console.log("err", err);
//   }
// });

//get all posts
router.get("/", async (req, res) => {
  console.log("req.body", req.body);

  const { title, caption, content } = req.body;

  try {
    console.log("---getPosts Initiated---");
    let allPosts = [];
    const postsGetRes = await Posts.orderBy("created", "desc").get();
    postsGetRes.docs.forEach((doc) => {
      console.log("get all docs doc.data()", doc.data());
      var post = doc.data();
      post.id = doc.id;
      allPosts.push(post);
    });
    res.json(allPosts);
  } catch (err) {
    console.log("err", err);
  }
});

//get all users posts
router.get("/user", auth, async (req, res) => {
  console.log("req.body", req.body);
  console.log("req.user", req.user);

  const { uid } = req.user;

  try {
    console.log("---getUsersPosts Initiated---");
    await Posts.where("creator", "==", `${uid}`)
      .get()
      .then((usersPosts) => {
        var userObject = [];
        usersPosts.forEach((doc) => {
          var postData = doc.data();
          postData.id = doc.id;
          userObject.push(postData);
          console.log("usersPost log", doc.data());
        });
        console.log(`all usersPosts: `, userObject);
        res.json(userObject);
      })
      .catch();
  } catch (err) {
    console.log("err", err);
  }
});
module.exports = router;
