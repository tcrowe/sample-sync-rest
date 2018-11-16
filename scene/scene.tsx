import * as DCL from "decentraland-api";
import { Vector3Component } from "decentraland-api";

/*

IPixelHashTable is used like this:

table["one"] = "two";

*/
interface IPixelHashTable {
  [key: string]: string;
}

/*

IColorVec3HashTable is used for Vec3:
table["one"] = {x: 0, y: 0, z: 0};

*/
interface IColorVec3HashTable {
  [key: string]: Vector3Component;
}

/*
The scene state is very simple:
+ which color is selected on the palette
+ the wall block colors hash table
*/
interface IState {
  paletteColor: string;
  wallBlockColors: IPixelHashTable;
}

/*

IDBPixel represents what is stored in the database

See ../server/server.ts#pixelSchema

*/
interface IDBPixel {
  _id: string;
  x: number;
  y: number;
  color: string;
}

const wallBlocksX: number = 21;
const wallBlocksY: number = 6;
const wallWidth = 7;
const wallHeight = 2;
const wallOffsetX = 0.75;
const wallOffsetY = 1;
const wallPixelPrefix = "wall-pixel-";
const wallPixelZ = 5;

const wallPixelScale: Vector3Component = {
  x: wallWidth / wallBlocksX - 0.01,
  y: wallHeight / wallBlocksY - 0.01,
  z: 0.01
};

const swatchPrefix = "swatch-";

// z = 0.1 or else clicks would not fire
const swatchScale = { x: 0.16, y: 0.16, z: 0.1 };
const swatchSelectedScale = { x: 0.18, y: 0.18, z: 0.1 };

/*

Color list

Source:
https://www.patternfly.org/styles/color-palette/

+ some are commented to get the entity count down
+ more wall pixels could be added if the palette is truncated

*/
const swatchColors = [
  "#fbdebf",
  "#f7bd7f",
  "#f39d3c",
  "#ec7a08",
  "#b35c00",
  "#773d00",
  // "#3b1f00",
  "#fbeabc",
  "#f9d67a",
  "#f5c12e",
  "#f0ab00",
  "#b58100",
  "#795600",
  // "#3d2c00",
  "#e4f5bc",
  "#c8eb79",
  "#ace12e",
  "#92d400",
  "#6ca100",
  "#486b00",
  // "#253600",
  "#cfe7cd",
  "#9ecf99",
  "#6ec664",
  "#3f9c35",
  "#2d7623",
  "#1e4f18",
  // "#0f280d",
  "#bedee1",
  "#7dbdc3",
  "#3a9ca6",
  "#007a87",
  "#005c66",
  "#003d44",
  // "#001f22",
  "#beedf9",
  "#7cdbf3",
  "#35caed",
  "#00b9e4",
  "#008bad",
  "#005c73",
  // "#002d39",
  "#def3ff",
  "#bee1f4",
  "#7dc3e8",
  "#39a5dc",
  "#0088ce",
  "#00659c",
  // "#004368",
  // "#002235",
  "#c7bfff",
  "#a18fff",
  "#8461f7",
  "#703fec",
  "#582fc0",
  "#40199a",
  // "#1f0066",
  "#fafafa",
  // "#f5f5f5",
  "#ededed",
  // "#d1d1d1",
  "#bbbbbb",
  // "#8b8d8f",
  "#72767b",
  // "#4d5258",
  "#393f44",
  // "#292e34",
  "#030303",
  "#cc0000",
  "#a30000",
  "#8b0000",
  "#470000",
  "#2c0000",
  "transparent"
];

/*

The palette swatches grow a little when clicked and shrin when deactivated.

*/
const swatchTransition = {
  position: {
    duration: 300
  },
  scale: {
    duration: 300
  }
};

/*

There are two materials used for the wall:
+ wallPixelColorMaterial - opaque material which is the background for colors
+ wallPixelTransparentMaterial - transparent material used for no color

*/

const wallPixelColorMaterial = (
  <material
    id="wall-pixel-color-material"
    alpha={1}
    ambientColor="#FFFFFF"
    albedoColor="#FFFFFF"
    reflectivityColor="#FFFFFF"
    hasAlpha={false}
  />
);

const blankColor = "#0099CC";

const wallPixelTransparentMaterial = (
  <material
    id="wall-pixel-transparent-material"
    alpha={0.1}
    ambientColor={blankColor}
    albedoColor={blankColor}
    reflectivityColor={blankColor}
    hasAlpha={true}
    transparencyMode={2}
  />
);

/*

An [x] icon shows on the palette. This is that texture material.

*/

const transparentMaterial = (
  <basic-material
    id="transparent-material"
    texture="./textures/transparent-texture.png"
  />
);

const apiUrl = "http://127.0.0.1:7753/api/pixels";

/*
The fetch function always sends and receives JSON. This is for reuse for all
requests.
*/
const headers = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const wallPixelPositions: IColorVec3HashTable = {};
const wallPixelColorsInit: IPixelHashTable = {};


/*

Generate all the default block and color state before loading from the server.

*/
for (let xIndex = 0; xIndex < wallBlocksX; xIndex += 1) {
  for (let yIndex = 0; yIndex < wallBlocksY; yIndex += 1) {
    const key = `${xIndex}-${yIndex}`;
    const x = (wallWidth / wallBlocksX) * xIndex + wallOffsetX;
    const y = (wallHeight / wallBlocksY) * yIndex + wallOffsetY;
    wallPixelPositions[key] = { x, y, z: wallPixelZ };
    wallPixelColorsInit[key] = "transparent";
  }
}

export default class HttpScene extends DCL.ScriptableScene<any, IState> {
  public state: IState = {
    paletteColor: "transparent",
    wallBlockColors: wallPixelColorsInit
  };

  /**
   * Triggered when the user clicks a wall block/pixel.
   */
  private wallPixelClick(elementId: string): void {
    const scene = this;
    const { paletteColor, wallBlockColors } = scene.state;
    const color = paletteColor;
    const [x, y] = elementId.replace(wallPixelPrefix, "").split("-");
    const key = `${x}-${y}`;
    let url = `${apiUrl}/pixel/?x=${x}&y=${y}`;
    let method = "POST";
    let body = "";

    fetch(url)
      .then(res => res.json())
      .then(function(res) {
        if (res.error !== undefined) {
          return console.error(url, res.error);
        }

        const keys = Object.keys(res);

        if (keys.length === 0) {
          // PUT
          method = "PUT";
          url = `${apiUrl}/pixel`;
        }

        if (res._id !== undefined) {
          // POST or DELETE to the _id
          url = `${apiUrl}/pixel/${res._id}`;
        }

        if (color === "transparent") {
          method = "DELETE";
        }

        if (method === "PUT" || method === "POST") {
          body = JSON.stringify({ x, y, color });
        }

        fetch(url, { method, body, headers })
          .then(res => res.json())
          .then(function(res) {
            if (res.error !== undefined) {
              return console.error(res.error);
            }

            wallBlockColors[key] = color;
            scene.setState({ wallBlockColors });
          })
          .catch(err => console.error("error putting single pixel", err));
      })
      .catch(err => console.error("error getting single pixel", err));
  }

  /**
   * Triggered when a user clicks a color palette swatch.
   */
  private swatchClick(elementId: string): void {
    let paletteColor = elementId.replace(swatchPrefix, "");
    this.setState({ paletteColor });
  }

  /**
   * Draw the color palette background and swatches.
   */
  private drawPalette(): DCL.ISimplifiedNode {
    const { paletteColor } = this.state;

    const bg = (
      <plane
        id="palette-background"
        scale={{ x: 2.2, y: 1, z: 0 }}
        position={{ x: 0, y: 0, z: 0 }}
        color="#666666"
      />
    );

    let rowY = 0;

    /*
    
    Loop through all the colors in `swatchColors` array creating a button
    for each.
    
    */
    const swatches = swatchColors.map(function(color, index) {
      const id = `${swatchPrefix}${color}`;
      const x = ((index % 12) + 1) / 6 - 1.08;
      if (index % 12 === 0) {
        rowY -= 0.17;
      }
      const y = rowY + 0.5;
      const selected = color === paletteColor;
      const z = selected ? -0.03 : -0.01;
      const position = { x, y, z };
      const scale = selected ? swatchSelectedScale : swatchScale;

      if (color === "transparent") {
        return (
          <plane
            id={`${swatchPrefix}transparent`}
            material="#transparent-material"
            position={position}
            scale={scale}
            transition={swatchTransition}
          />
        );
      }

      return (
        <plane
          id={id}
          position={position}
          scale={scale}
          color={color}
          transition={swatchTransition}
        />
      );
    });

    /*
    The container allows us to rotate all of the elements inside facing
    it in a convenient place for the user.
    */
    const paletteContainer = (
      <entity
        id="palette-container"
        position={{ x: 8.5, y: 1, z: 3 }}
        rotation={{ x: 30, y: 50, z: 0 }}
      >
        {bg}
        {swatches}
      </entity>
    );

    return paletteContainer;
  }

  /**
   * Draw all the wall pixels in color or as a transparent box.
   */
  private drawWallPixels(): DCL.ISimplifiedNode[] {
    const { wallBlockColors } = this.state;

    return Object.keys(wallBlockColors).map(function(key: string) {
      const id = `${wallPixelPrefix}${key}`;
      const position: Vector3Component = wallPixelPositions[key];
      const color: string = wallBlockColors[key];

      if (
        color === undefined ||
        color === null ||
        color === "transparent" ||
        color === ""
      ) {
        // Transparent (glass) box
        return (
          <plane
            id={id}
            position={position}
            scale={wallPixelScale}
            material="#wall-pixel-transparent-material"
            color="transparent"
          />
        );
      }

      // Color box
      return (
        <plane
          id={id}
          position={position}
          scale={wallPixelScale}
          material="#wall-pixel-color-material"
          color={color}
        />
      );
    });
  }

  /**
   * Get all the pixel colors from the server and merge it into the state.
   *
   * It's used to poll the server each second with `setInterval`
   */
  private synchronizeWall(): void {
    const scene = this;

    // GET /api/pixels
    fetch(apiUrl)
      .then(res => res.json())
      .then(function(res) {
        const { wallBlockColors } = scene.state;

        Object.keys(wallBlockColors).forEach(function(blockKey) {
          const isColorSet = res.some((pixel: IDBPixel) => {
            const { x, y, color } = pixel;
            const pixelKey = `${x}-${y}`;

            if (pixelKey === blockKey) {
              wallBlockColors[blockKey] = color;
              return true;
            }

            return false;
          });

          if (isColorSet === false) {
            wallBlockColors[blockKey] = "transparent";
          }
        });

        scene.setState({ wallBlockColors });
      })
      .catch(err => console.error("error getting all pixels", err));
  }

  public sceneDidMount(): void {
    const scene = this;

    //
    // hook up click event for wall and palette planes
    //
    scene.eventSubscriber.on("click", function(evt: any) {
      const { elementId } = evt.data;

      if (elementId.startsWith(wallPixelPrefix) === true) {
        scene.wallPixelClick(elementId);
      }

      if (elementId.startsWith(swatchPrefix) === true) {
        scene.swatchClick(elementId);
      }
    });

    //
    // synchronize the wall from the db
    // keep synchronizing each second
    //
    scene.synchronizeWall();
    setInterval(() => scene.synchronizeWall(), 1000);
  }

  /**
   * The materials are loaded from the top then `drawPalette` and
   * `drawWallPixels` are called to draw the boxes for those elements.
   */
  public async render() {
    return (
      <scene id="sample-sync-rest">
        {wallPixelTransparentMaterial}
        {wallPixelColorMaterial}
        {transparentMaterial}
        {this.drawPalette()}
        {this.drawWallPixels()}
      </scene>
    );
  }
}
