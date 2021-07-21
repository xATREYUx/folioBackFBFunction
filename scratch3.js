//index.js
app.use(cookieParser());

app.use("/posts", require("./routers/postRouter"));

//postRouter.js
var Busboy = require("busboy");

router.post("/", (req, res) => {
  console.log("---postsrouter post---", req);

  var busboy = new Busboy({
    headers: {
      ...req.headers,
    },
  });

  console.log("---postsrouter busboy---", busboy);

  busboy.on("field", (fieldname, val) => {
    console.log("Log field: ", fieldname);
  });

  busboy.on("error", (error) => {
    console.log("Log busboy error: ", error);
  });

  busboy.on("finish", function () {
    console.log("Done parsing form!");
  });

  res.json("busboy fired");
});

//Abbreviation of my frontend form to show how I create the formData object that I send, in case that has anything to do with it
const submitPost = async (data) => {
  console.log("send data", data);
  console.log("send pickedCardImage", pickedCardImage);

  var formData = new FormData();

  try {
    const dataFunction = async () => {
      formData.append("title", data.title);
      formData.append("caption", data.caption);
      formData.append("content", data.content);
      formData.append("cardImage", pickedCardImage);
      formData.append("postImageOne", pickedCardImageOne);
      formData.append("postImageTwo", pickedCardImageTwo);
    };
    await dataFunction();

    //send formData to backend
    await createPost(formData);

    return (
      <form
        id="new-post-form"
        onSubmit={handleSubmit(submitPost)}
        enctype="multipart/form-data"
      >
        <h1>New Post</h1>
        <br />
        <label>Content</label>
        <br />
        <textarea
          type="textarea"
          placeholder="Content"
          name="content"
          cols="30"
          rows="10"
          {...register("content")}
        />
        <br />
        <br />

        <ImageUpload
          name="cardImage"
          displayName="Card Image"
          setImage={setPickedCardImage}
          resetForm={resetComponent}
        />

        {appendErrors.password && <p>{appendErrors.password.message}</p>}
        <br />
        <Button type="submit">Post</Button>
      </form>
    );
  } catch (err) {
    console.log("submitPost error", err);
  }
};
