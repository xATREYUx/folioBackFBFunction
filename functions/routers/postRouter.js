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
router.post("/", auth, (req, res) => {
  console.log("---postsrouter post---", req);
  // if (req.method !== "POST") {
  //   // Return a "method not allowed" error
  //   return res.status(405).end();
  // }

  const { uid } = req.user;

  const busboy = new Busboy({ headers: req.headers });

  let fields = {};
  let imageFileName = {};
  let imagesToUpload = [];
  let imageToAdd = {};
  let imageUrls = [];

  busboy.on("field", (fieldname, fieldvalue) => {
    fields[fieldname] = fieldvalue;
  });

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted!" });
    }

    // Getting extension of any image
    const newFileName =
      path.parse(filename).name + "-" + Date.now() + path.parse(filename).ext;
    // const imageExtension = filename.split(".")[filename.split(".").length - 1];

    // Setting filename
    // imageFileName = newFileName;

    // Creating path
    const filepath = path.join(os.tmpdir(), newFileName);
    imageToAdd = {
      imageFileName,
      filepath,
      mimetype,
    };

    file.pipe(fs.createWriteStream(filepath));
    //Add the image to the array
    imagesToUpload.push(imageToAdd);
  });

  busboy.on("finish", async () => {
    let promises = [];

    imagesToUpload.forEach((imageToBeUploaded) => {
      imageUrls.push(
        `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURI(imageFileName)}?alt=media`
      );
      let token = uuidv4();
      promises.push(
        admin
          .storage()
          .bucket()
          .upload(imageToBeUploaded.filepath, {
            resumable: false,
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
      await Promise.all(promises);
      return res.json({
        message: `Images URL: ${imageUrls}`,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  });

  busboy.end(req.rawBody);
  // const tmpdir = os.tmpdir();
  // const data = req.rawBody;
  // const xmlData = data.toString();
  // // console.log(`Field Data: `, xmlData);
  // const fields = {};
  // const uploads = {};
  // // try {
  // //   // This code will process each non-file field in the form.
  // busboy.on("field", (fieldname, val) => {
  //   // console.log(`Processed field ${filename}: ${val}.`);
  //   console.log("Log field: ", fieldname);

  //   // formData[fieldname] = val;
  // });
  // busboy.on("error", (error) => {
  //   // console.log(`Processed field ${filename}: ${val}.`);
  //   console.log("Log busboy error: ", error);
  // });
  // // file.on("finish", () => {
  // //   console.log("Log field2: [" + fieldname + "] Finished");
  // // });
  // busboy.on("finish", function () {
  //   console.log("Done parsing form!");
  // });

  //   const fileWrites = [];
  //   // This code will process each file uploaded.
  //   busboy.on("file", (fieldname, file, filename) => {
  //     // Note: os.tmpdir() points to an in-memory file system on GCF
  //     // Thus, any files in it must fit in the instance's memory.
  //     console.log(`Processed file ${filename}`);
  //     new Promise((resolve, reject) => {
  //       const filepath = path.join(tmpdir, filename);
  //       let token = uuidv4();
  //       const blob = bucket.file(fileName);
  //       const writeStream = blob.createWriteStream(filepath);
  //       file.pipe(writeStream);
  //       // File was processed by Busboy; wait for it to be written.
  //       // Note: GCF may not persist saved files across invocations.
  //       // Persistent files must be kept in other locations
  //       // (such as Cloud Storage buckets).
  //       const promise = new Promise((resolve, reject) => {
  //         file.on("end", () => {
  //           writeStream.end();
  //         });
  //         writeStream.on("finish", () => {
  //           console.log("---Assemblying Public URL & Metadata---", blob.name);
  //           const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
  //             bucket.name
  //           }/o/${encodeURI(blob.name)}?alt=media`;
  //           resolve({ [key]: publicUrl });
  //         });
  //         writeStream.on("error", reject);
  //       });
  //     });
  //     // Triggered once all uploaded files are processed by Busboy.
  //     // We still need to wait for the disk writes (saves) to complete.
  //     busboy.on("finish", async () => {
  //       await Promise.all(fileWrites);
  //       /**
  //        * TODO(developer): Process saved files here
  //        */
  //       blob.unlinkSync(file);
  //       res.send();
  //     });
  //     busboy.end(req.rawBody);
  //   });
  // } catch (err) {
  //   console.log("form error: ", err);
  // }
});
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
