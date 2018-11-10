import * as express from "express";
import * as cors from "cors";
import * as mongoose from "mongoose";
import { Schema, Document } from "mongoose";
import * as bodyParser from "body-parser";
const isNumber = require('lodash/isNumber');
const isFinite = require('lodash/isFinite');
const isString = require('lodash/isString');
const validHexPattern = /^#[0-9A-F]{3,6}$/;

//
// express app config
//
const expressApp = express();
const pixelRouter = express.Router();
const port = 7753;
const host = "127.0.0.1";

expressApp.use(cors());

//
// Pixel schema and model
//
const pixelSchema = new Schema({
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  }
});

const Pixel = mongoose.model("Pixel", pixelSchema);

//
// get all pixels
// GET /api/pixels/
//
pixelRouter.get("/", function(req: express.Request, res: express.Response) {
  Pixel.find({}, function(err: Error, pixels: Document[]) {
    if (err !== undefined && err !== null) {
      const msg = "error getting all pixels";
      console.error(msg, err);
      return res.status(500).json({ error: msg });
    }

    res.status(200).json(pixels);
  })
});

//
// get one pixel by {x,y}
// GET /api/pixels/pixel/?x=0&y=0
//
pixelRouter.get("/pixel", function(req: express.Request, res: express.Response) {
  const { x, y } = req.query;

  if (isNumber(x) === false || isFinite(x) === false || isNumber(y) === false || isFinite(y) === false) {
    const msg = "invalid x or y querystring parameter";
    return res.status(400).json({ error: msg });
  }

  Pixel.findOne({ x, y }, function(err:Error, pixel: Document) {
    if (err !== undefined && err !== null) {
      const msg = `error getting one pixel, x: ${x}, y: ${y}`;
      console.error(msg, err);
      return res.status(500).json({ error: msg });
    }

    res.status(200).json(pixel);
  });
});

//
// put a new pixel which does not exist in the db yet
// PUT /api/pixels/pixel
//
pixelRouter.put("/pixel", bodyParser.urlencoded({ extended: false }), function(req: express.Request, res: express.Response) {
  const { x, y, color } = req.body;

  if (isNumber(x) === false || isFinite(x) === false || isNumber(y) === false || isFinite(y) === false) {
    const msg = `invalid x or y put body in PUT, x: ${x}, y: ${y}`;
    console.error(msg);
    return res.status(400).json({ error: msg });
  }

  if (isString(color) === false || validHexPattern.test(color) === false) {
    const msg = `the color was not valid hex, color: ${color}`;
    console.error(msg);
    return res.status(400).json({ error: msg });
  }

  Pixel.findOne({ x, y }, function(err: Error, pixel: Document) {
    if (err !== undefined && err !== null) {
      const msg = `error getting one pixel for PUT, x: ${x}, y: ${y}`;
      console.error(msg, err);
      return res.status(500).json({ error: msg });
    }

    if (pixel !== null) {
      const msg = `cannot put a pixel where it already exists, try post, x: ${x}, y: ${y}`;
      console.error(msg);
      return res.status(400).json({ error: msg });
    }

    Pixel.create({x, y, color}, function(err: Error, pixel: Document) {
      if (err !== undefined && err !== null) {
        const msg = `error while creating pixel, x: ${x}, y: ${y}, color: ${color}`;
        console.error(msg, err);
        return res.status(500).json({ error: msg });
      }

      res.status(200).json(pixel);
    });
  });
});

//
// post an existing pixel that we already know about by id
// POST /api/pixels/pixel/:id
//
pixelRouter.post("/pixel/:id", bodyParser.urlencoded({ extended: false }), function(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const { color } = req.body;

  if (isString(color) === false || validHexPattern.test(color) === false) {
    const msg = `the color was not valid hex, color: ${color}`;
    console.error(msg);
    return res.status(400).json({ error: msg });
  }

  Pixel.findOne({ id }, function(err: Error, pixel: Document) {
    if (err !== undefined && err !== null) {
      const msg = `error while getting one pixel for POST, id: ${id}, color: ${color}`;
      console.error(msg, err);
      return res.status(500).json({ error: msg });
    }

    if (pixel === null) {
      const msg = `cannot POST to a non-existent pixel id, id: ${id}, color: ${color}`;
      console.error(msg);
      return res.status(400).json({ error: msg });
    }

    pixel.set('color', color);

    pixel.save(function(err:Error) {
      if (err !== undefined && err !== null) {
        const msg = `error while saving one pixel for POST, id: ${id}, color: ${color}`;
        console.error(msg, err);
        return res.status(500).json({ error: msg });
      }

      res.status(200).json(res);
    })
  });
});

//
// delete an existing pixel that we know of by id
// DELETE /api/pixels/pixel/:id
//
pixelRouter.delete("/pixel/:id", function(req: express.Request, res: express.Response) {
  const { id } = req.params;

  Pixel.findById(id, function(err: Error, pixel: Document) {
    if (err !== undefined && err !== null) {
      const msg = `could not find document by id to DELETE, id: ${id}`;
      console.error(msg, err);
      return res.status(500).json({ error: msg });
    }

    Pixel.deleteOne({ id }, function(err:Error) {
      if (err !== undefined && err !== null) {
        const msg = `could not delete by id to DELETE, id: ${id}`;
        console.error(msg, err);
        return res.status(500).json({ error: msg });
      }

      res.status(200).json({ deleted: true });
    })
  })
});

//
// attach the pixels REST router
//
expressApp.use("/api/pixels", pixelRouter);

//
// start up the express app
//
expressApp.listen(port, host);
console.log(`listening http://${host}:${port}`);
