
# sample-sync-rest: The Build System

The REST sample has two parts, similar to how it was done in [sample-sync-websockets](/tcrowe/sample-sync-websockets).

+ `./scene` -- The Decentraland scene and preview
+ `./server` -- The REST server using [Express](https://expressjs.com)

It will be helpful to use a different terminal window to test each project.

## Stubbing the client

We'll put it into the `./scene` directory.

```sh
mkdir scene
cd scene
```

To bootstrap the scene please refer to the [Decentraland's "Getting Started"](https://docs.decentraland.org/getting-started/create-scene/) documents to get started.

To test if the scene is running try the following commands.

```sh
npm start
```

If successful the preview will show up.

---

## Stubbing out the server

[Install MongoDB](https://docs.mongodb.com/manual/installation/) for the database server. After that we can drop in some supporting modules for the server.

```sh
# Create the server directory and enter into it
mkdir server
cd server

# Create the node project
npm init

# Start with a server placeholder
touch server.ts

# Install node dependencies
npm install @types/body-parser @types/cors @types/express @types/lodash @types/mongoose body-parser cors express lodash mongoose nodemon ts-node typescript
```

In our `./package.json` `scripts` object we should specify that we want to run the scene preview AND our server simultaneously.

```json
"scripts": {
  "scripts": {
    "watch": "nodemon -q -L -d 1 -w server.ts -w lib --ext ts --exec ts-node --project tsconfig.json --pretty server.ts || true",
    "start": "ts-node --project tsconfig.json --pretty server.ts"
  }
}
```

For the example we changed the scene port to `7752` and the server to `7753`.

---

[Next: The Mongoose Pixel Model](./mongoose-pixel-model.md)
[Back to Docs](./readme.md)