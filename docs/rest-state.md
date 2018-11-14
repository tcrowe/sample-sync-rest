
# sample-sync-rest: Synchronize state with HTTP REST

When a user joins the scene they will request all the pixels that make up the canvas.

[shapes](../img/shapes.png)

In the browser, even in the context of the WebWorkers, there is a function called `fetch` we can use to request all the pixels.

`./scene/scene.tsx`

```ts
const apiUrl = "http://127.0.0.1:7753/api/pixels";

public sceneDidMount(): void {
  // GET /api/pixels
  // Get an array of all the pixels
  fetch(apiUrl)
    // get the JSON response
    .then(res => res.json())
    .then(function(res) {
      // wallBlockColors is a hash table that stores the pixels
      const { wallBlockColors } = scene.state;

      // Set each pixel color by coordinates
      res.forEach(function(pixel: any) {
        const { x, y, color } = pixel;
        const key = `${x}-${y}`;
        wallBlockColors[key] = color;
      });

      // Update the scene
      scene.setState({ wallBlockColors });
    })
    .catch(err => console.error("error getting all pixels", err));
}
```

Over on the server we handle this request for all the pixels.

`./server/server.ts`

```ts
// At the top we depend on these few modules and the Pixel model from the previous example.
import * as express from "express";
import * as cors from "cors";
import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";
import * as bodyParser from "body-parser";

// Use this to validate color inputs
const validColorPattern = /^#[0-9A-F]{3,6}$/i;

//
// GET /api/pixels/
//
pixelRouter.get("/", function(req: express.Request, res: express.Response) {
  // Using `find` with no conditions it will give us all of the pixel objects
  Pixel.find({}, function(err: Error, pixels: Document[]) {
    if (err !== undefined && err !== null) {
      const msg = "error getting all pixels";
      // On the server we log the actual error
      console.error(msg, err);
      // Status 500 is Server Error
      // We do not send the error to the user for security purposes.
      // The `err` object may contain information about the server we don't
      // want users to have access to.
      return res.status(500).json({ error: msg });
    }

    // Everything is okay at this pount
    // Send 200 OK and the JSON result
    res.status(200).json(pixels);
  });
});
```

The server will send the result back to the client and then the client sets the pixels into the scene state.

## REST: methods PUT, POST, DELETE

The method `wallPixelClick` is in the scene to handle when the users click a pixel on the wall.

`./scene/scene.tsx`

```ts
private wallPixelClick(elementId: string): void {
  const scene = this;
  const { wallBlockColors } = scene.state;
  
  // paletteColor is set in the swatchClick method
  const color = scene.state.paletteColor;
  
  // Each block is named with the coordinates making it easier to find the {x,y}
  const [x, y] = elementId.replace(wallPixelPrefix, "").split("-");
  
  let url = `${apiUrl}/pixel/?x=${x}&y=${y}`;

  // GET /api/pixels/pixel/?x=0&y=0
  // try to find this pixel in from the database by using
  fetch(url)
    .then(res => res.json())
    .then(function(res) {
      // the server can provide an error if something goes wrong
      // for now we only display in the console. giving visible user feedback
      // would be difficult.
      if (res.error !== undefined) {
        return console.error(url, res.error);
      }

      // If there's no keys we just know it doesn't exist in the database
      const keys = Object.keys(res);
      
      if (keys.length === 0) {
        // It doesn't exist so we can use the PUT REST method
        // PUT /api/pixels/pixel/
        method = "PUT";
        url = `${apiUrl}/pixel`;
      }

      if (res._id !== undefined) {
        // For POST or DELETE we change the URL to be like:
        // POST /api/pixels/pixel/5
        url = `${apiUrl}/pixel/${res._id}`;
      }
      
      if (color === "transparent") {
        // For transparent we use the DELETE REST method
        // For example: DELETE /api/pixels/pixel/5
        method = "DELETE";
      }
      
      if (method === "PUT" || method === "POST") {
        // PUT for creating a pixel
        // POST for updating an existing pixel
        // The body is the JSON being sent to the server
        body = JSON.stringify({ x, y, color });
      }

      // send the pixel request
      // PUT, POST, or DELETE
      fetch(url, { method, body, headers })
        // Convert the response from JSON into an object
        .then(res => res.json())
        .then(function(res) {
          // The server can respond with an error so we write it to the log and stop.
          if (res.error !== undefined) {
            return console.error(res.error);
          }

          // The database saved the information.
          // Update the scene state showing the color in the block.
          wallBlockColors[`${x}-${y}`] = color;
          scene.setState({ wallBlockColors });
        })
        .catch(err => console.error("error putting single pixel", err));
    })
    .catch(err => console.error("error getting single pixel", err));
}
```

In order to handle the above the server will handle `PUT`, `POST`, and `DELETE` methods.

There are debates on how people should use `PUT` or `POST`. Which one does create? Which does update? Should there be this confusion in the HTTP protocol?

In this example we use `PUT` for creating or adding into the database. `POST` is used to update existing records. As developers, whatever we choose, we will make it easier for the users if we define that scheme and do it consistently. Other protocols in the future may be more clear about that.

For this example we'll only implement `PUT` because it's similar how it's done for all the methods. It will be clear how to validate the data and change the database.

```ts
//
// Put a new pixel which does not exist in the db yet
// PUT /api/pixels/pixel
//
pixelRouter.put("/pixel", bodyParser.json(), function(
  req: express.Request,
  res: express.Response
) {
  // The client has sent the data but we don't know if it's actually valid.
  // A lot of problems can arise if we don't validate it. We will do the validation next.
  let { x, y, color } = req.body;

  // The {x,y} must be number or else we return a 400 invalid response
  if (isNaN(x) === true || isNaN(y) === true) {
    const msg = `x or y were not a number, x: ${x}, y: ${y}`;
    return res.status(400).json({ error: msg });
  }

  // We only take integers because there is no pixel {x: 5.5}
  // There can only be whole numbers
  x = parseInt(x);
  y = parseInt(y);

  // The color can only be a string like "#0099CC" or else it's rejected with a 400 invalid
  if (typeof color !== "string" || validColorPattern.test(color) === false) {
    const msg = `the color was not valid hex, color: ${color}`;
    console.error(msg);
    return res.status(400).json({ error: msg });
  }

  // The user-submitted data appears valid so we feel safer to use it to make a query
  // into the database. If we did not validate it the user might be having us query
  // or add junk into the database.
  
  // Further validation could be used to limit {x,y} to the 21x6 boxes we have.
  // I leave that task to you!

  // Try to find if this pixel exists in the database first
  Pixel.findOne({ x, y }, function(err: Error, pixel: Document) {
    if (err !== undefined && err !== null) {
      // There was a server error
      const msg = `error getting one pixel for PUT, x: ${x}, y: ${y}`;
      
      // On the server we output the error but, again, we don't send the whole
      // error back to the user for security purposes.
      console.error(msg, err);
      
      // For the client(the Decentraland scene) we only send the basic error message
      // which does not include any sensitive information.
      return res.status(500).json({ error: msg });
    }

    if (pixel !== null) {
      // A pixel was actually found at that coordinate.
      // The PUT method can only be used for a non-existing pixel. We block this invalid action.
      const msg = `cannot put a pixel where it already exists, try post, x: ${x}, y: ${y}`;
      console.error(msg);
      return res.status(400).json({ error: msg });
    }

    // All the validations were okay. Save this new pixel into the database.
    Pixel.create({ x, y, color }, function(err: Error, pixel: Document) {
      if (err !== undefined && err !== null) {
        // There was an error saving so, as the above, we just send a simple message.
        const msg = `error while creating pixel, x: ${x}, y: ${y}, color: ${color}`;
        console.error(msg, err);
        return res.status(500).json({ error: msg });
      }

      // Everything was okay. The pixel was saved into the database.
      // Send the pixel back so the scene can have the ID.
      res.status(200).json(pixel);
    });
  });
});
```

The example above shows the safeguards you can build into the system in order to prevent bad data from going into the database. It's very time consuming to figure out why or how bad data got into the database. The logs may tell you but it will be time consuming to figure out.

The best way to ensure a reliable user experience is to er on the side of caution and validate all the inputs to the best of your ability. Mongoose is going to help with that job and you can use other methods that you know like the Regular Expression above.

`const validColorPattern = /^#[0-9A-F]{3,6}$/i;`

Another thing you can try is hacking your own app looking for weaknesses. What can we do with that `fetch()` function? Thinking like a malicious hacker will help you prevent other problems in the future. If possible, put on your hacker hat (they look like this 👒 if you've never seen one), and hack to learn.

If you want more look for `.post` and `.delete` in `./server/server.ts`.

Thank you and take care!

---

[Back to Docs](./readme.md)