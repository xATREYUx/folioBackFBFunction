const router = require("express").Router();
const { check } = require("express-validator");

const auth = require("../middleware/auth");

const admin = require("firebase-admin");
const bucket = admin.storage().bucket();
const db = admin.firestore();

const axios = require("axios");

const path = require("path");
const os = require("os");
const fs = require("fs");
const Busboy = require("busboy");

const uploader = require("../middleware/file-upload");
const { v4: uuidv4 } = require("uuid");

const Posts = db.collection("posts");
const Users = db.collection("users");

// new
router.post(
  "/",
  auth,
  (req, res) => {
    console.log("---postsrouter post---");
    if (req.method !== "POST") {
      console.log("method not allowed");
      return res.status(405).end();
    }

    const { uid } = req.user;

    const busboy = new Busboy({ headers: req.headers });
    console.log("---postsrouter req.headers---", req.headers);

    let fields = {};
    let imageFileName = {};
    let imagesToUpload = [];
    let imageToAdd = {};
    let imageUrls = [];
    let newFileName = "";

    busboy.on("field", (fieldname, fieldvalue) => {
      console.log("---postsrouter busboy.on('field') initiated---");

      console.log(fieldname);
      fields[fieldname] = fieldvalue;
    });

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log("---postsrouter busboy.on('file') initiated---");

      if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
        return res.status(400).json({ error: "Wrong file type submitted!" });
      }

      // Getting extension of any image
      newFileName =
        path.parse(filename).name + "-" + Date.now() + path.parse(filename).ext;
      console.log("newFileName", newFileName);

      // Creating path
      const filepath = path.join(os.tmpdir(), newFileName);
      imageToAdd = {
        newFileName,
        filepath,
        mimetype,
      };

      file.pipe(fs.createWriteStream(filepath));
      //Add the image to the array
      imagesToUpload.push(imageToAdd);
    });

    busboy.on("finish", async () => {
      console.log("---postsrouter busboy.on('finish') initiated---");

      let promises = [];

      imagesToUpload.forEach((imageToBeUploaded) => {
        imageUrls.push(
          `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/postImages%2F${encodeURI(
            imageToBeUploaded.newFileName
          )}?alt=media`
        );
        let token = uuidv4();
        promises.push(
          admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filepath, {
              resumable: false,
              destination: `postImages/${imageToBeUploaded.newFileName}`,
              metadata: {
                metadata: {
                  contentType: imageToBeUploaded.mimetype,
                  firebaseStorageDownloadTokens: token,
                },
              },
            })
        );
      });

      try {
        console.log("---Post Promises initiated---");

        await Promise.all(promises);
        const { title, caption, content } = fields;
        var newPostData = {
          title,
          caption,
          content,
          creator: uid,
          created: admin.firestore.Timestamp.now().seconds,
          postURLs: imageUrls,
        };
        const newPostRes = await Posts.add(newPostData);
        console.log("---newPostRes---", newPostRes.id);
        newPostData.id = newPostRes.id;
        //adds post id to users posts array
        const unionRes = await Users.doc(uid).update({
          posts: admin.firestore.FieldValue.arrayUnion(newPostRes.id),
        });
        console.log("---Successfully added to user posts array---", unionRes);
        res.status(200).send(newPostData);
      } catch (err) {
        console.log("createPost error", err);
        res.status(500).json(err);
      }
    });

    busboy.end(req.rawBody);
  },

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
  })
);

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

router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const deleteRes = await Posts.doc(id).delete();

    res.json(deleteRes);
  } catch (err) {
    console.log("err", err);
  }
});

//Update Post
router.put("/:id", auth, async (req, res) => {
  console.log("---updatePost Initiated---");
  const { uid } = req.user;
  const { id } = req.params;
  const docRef = Posts.doc(id);
  console.log("---docRef id---", id);

  const busboy = new Busboy({ headers: req.headers });
  console.log("---postsrouter req.headers---", req.headers);

  let fields = {};
  let imageFileName = {};
  let imagesToUpload = [];
  let imageToAdd = {};
  let imageUrls = [];
  let newFileName = "";

  busboy.on("field", (fieldname, fieldvalue) => {
    console.log("---updatePost busboy.on('field') initiated---");
    console.log(fieldname);
    fields[fieldname] = fieldvalue;
  });

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log("---updatePost busboy.on('file') initiated---");

    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted!" });
    }

    // Getting extension of any image
    newFileName =
      path.parse(filename).name + "-" + Date.now() + path.parse(filename).ext;
    console.log("newFileName", newFileName);

    // Creating path
    const filepath = path.join(os.tmpdir(), newFileName);
    imageToAdd = {
      newFileName,
      filepath,
      mimetype,
    };

    file.pipe(fs.createWriteStream(filepath));
    //Add the image to the array
    imagesToUpload.push(imageToAdd);
  });

  busboy.on("finish", async () => {
    console.log("---Edit postsrouter busboy.on('finish') initiated---");

    let promises = [];

    imagesToUpload.forEach((imageToBeUploaded) => {
      imageUrls.push(
        `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/postImages%2F${encodeURI(imageToBeUploaded.newFileName)}?alt=media`
      );
      let token = uuidv4();
      promises.push(
        admin
          .storage()
          .bucket()
          .upload(imageToBeUploaded.filepath, {
            resumable: false,
            destination: `postImages/${imageToBeUploaded.newFileName}`,
            metadata: {
              metadata: {
                contentType: imageToBeUploaded.mimetype,
                firebaseStorageDownloadTokens: token,
              },
            },
          })
      );
    });

    try {
      console.log("---Post Edit Promises Initiated---");

      await Promise.all(promises);
      const { title, caption, content } = fields;
      var editPostData = {
        title,
        caption,
        content,
        creator: uid,
        updated: admin.firestore.Timestamp.now().seconds,
        postURLs: imageUrls,
      };
      const editPostRes = await docRef.update(editPostData);
      console.log("---editPostRes---", editPostRes.id);
      editPostRes.id = editPostRes.id;

      res.status(200).send(editPostData);
    } catch (err) {
      console.log("updatePost error", err);
      res.status(500).json(err);
    }
  });

  busboy.end(req.rawBody);
});

module.exports = router;
