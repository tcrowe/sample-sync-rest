
# sample-sync-rest

It's a [Decentraland](https://decentraland.org) scene to demonstrate how to incorporate an HTTP-REST API.

![blank](./img/blank-canvas.png)

![shapes](./img/shapes.png)

![success](./img/success.png)

[Docs](./docs)
+ [The Build System](./docs/build-system.md)
+ [The Mongoose Pixel Model](./docs/mongoose-pixel-model.md)
+ [Synchronize the REST State](./docs/rest-state.md)

## REST functions

+ GET /api/pixels
  * get all pixels
+ GET /api/pixels/pixel/?x=6&y=4
  * get a single pixel at {x,y} coordinate from db
+ PUT /api/pixels/pixel
  * put a new pixel into the db
+ POST /api/pixels/pixel/:id
  * post an existing pixel back into the db
+ DELETE /api/pixels/pixel/:id
  * delete existing pixel

## Install

It uses MongoDB so please [Install MongoDB](https://docs.mongodb.com/manual/installation/) before continuing.

```sh
# clone to your machine
git clone https://github.com/tcrowe/sample-sync-rest.git
cd sample-sync-rest
```

## Run the scene preview

```sh
# from the project root
cd scene

# install node dependencies
npm install

# start the preview
npm start
```

## Run the REST server

(In another terminal window)

```sh
# from the project root
cd server

# install node dependencies
npm install

# start the server
npm start
```
## Database

Running the server and clicking around in the scene should automatically create the database.

You can confirm what is in the database by running:

```sh
mongodb

use sample-sync-rest
# switched to db sample-sync-rest

# list all pixels
db.pixels.find()

# ⚠️ delete all pixels
db.pixels.remove({})
```

## Contribute

If you notice that I've made an affront to correct TypeScript coding practices please forgive.

Others will want to use this as an example or starting place to fork from. If you see room for improvement please fork, mod, and send back here in a PR.

Thank you! 🤗
