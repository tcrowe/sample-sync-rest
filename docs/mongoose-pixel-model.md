
# sample-sync-rest: The Mongoose Pixel Model

[Mongoose](https://mongoosejs.com/) is a popular JS module that makes connecting with Mongo DB a breeze.

On the server all we have to do is define a `Schema`, connect it to Mongoose, and connect to the server and it's ready to read, write, and delete.

`./server/server.ts`

```ts
import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";

// Define the pixel Schema
const pixelSchema = new Schema({
  // The x-coordinate is a JS number
  x: {
    type: Number,
    required: true
  },
  // The y-coordinate is also a JS number
  y: {
    type: Number,
    required: true
  },
  // The pixel color is just a string like "#0099CC"
  // undefined, null, or "transparent" means the pixel is transparent like glass
  color: {
    type: String
  }
});

// The Model is created from the Schema
const Pixel = mongoose.model("Pixel", pixelSchema);
```

Mongoose, with all its magic, will connect, create the database and the Pixel collection.

`./server/server.ts`

```ts
// Connect to mongodb server
mongoose.connect(
  "mongodb://127.0.0.1:27017/sample-sync-rest",
  { useNewUrlParser: true }
);
```

**The examples below are just tests** to show how easy it is to add and remove data using JS or TypeScript. We do it differently in `./server/server.ts`.

```ts
// Try adding pixels into the database
Pixel.create({ x: 0, y: 0, color: "#0099CC" }, (err, res) => {
  console.log("pixel create err", err, "res", res)
});
Pixel.create({ x: 1, y: 1, color: "#FFFFFF" }, (err, res) => {
  console.log("pixel create err", err, "res", res)
});

// Get a list of all the pixels
Pixel.find({}, (err, res) => console.log("all pixels err", err, "res", res));

// Delete any pixels matching {x: 0}
Pixel.delete({x: 0}, (err) => console.log("pixel delete err", err));

// Delete only one pixel matching {y: 1}
Pixel.deleteOne({y: 1}, (err) => console.log("pixel delete err", err));
```

Using the terminal we can use these commands to show the data as well.

```sh
mongodb

use sample-sync-rest
# switched to db sample-sync-rest

# List all pixels
db.pixels.find()

# ⚠️ Delete all pixels
db.pixels.remove({})
```

That's it! It's pretty easy to work with MongoDB through Mongoose or the terminal.

If you want to follow up with more of the Mongoose interface it's documented here:
https://mongoosejs.com/docs/guide.html

The Mongo Shell is here:
https://docs.mongodb.com/manual/mongo/

---

[Next: Synchronize the REST State](./rest-state.md)
[Back to Docs](./readme.md)