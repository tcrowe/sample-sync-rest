import * as DCL from "decentraland-api";
import { Vector3Component } from "decentraland-api";

interface IPixelHashTable {
  [key: string]: string;
}

interface IColorVec3HashTable {
  [key: string]: Vector3Component;
}

interface IState {
  paletteColor: string;
  wallBlockColors: IPixelHashTable;
}

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

const swatchTransition = {
  position: {
    duration: 300
  },
  scale: {
    duration: 300
  }
};

const blankColor = "#0099CC";

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

const transparentMaterial = (
  <basic-material
    id="transparent-material"
    texture="./textures/transparent-texture.png"
  />
);

const apiUrl = "http://127.0.0.1:7753/api/pixels";

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const wallPixelPositions: IColorVec3HashTable = {};
const wallPixelColorsInit: IPixelHashTable = {};

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

  private swatchClick(elementId: string): void {
    let paletteColor = elementId.replace(swatchPrefix, "");
    this.setState({ paletteColor });
  }

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

  public sceneDidMount(): void {
    const scene = this;

    scene.eventSubscriber.on("click", function(evt: any) {
      const { elementId } = evt.data;

      if (elementId.startsWith(wallPixelPrefix) === true) {
        scene.wallPixelClick(elementId);
      }

      if (elementId.startsWith(swatchPrefix) === true) {
        scene.swatchClick(elementId);
      }
    });

    fetch(apiUrl)
      .then(res => res.json())
      .then(function(res) {
        const { wallBlockColors } = scene.state;

        res.forEach(function(pixel: IDBPixel) {
          const { x, y, color } = pixel;
          const key = `${x}-${y}`;
          wallBlockColors[key] = color;
        });

        scene.setState({ wallBlockColors });
      })
      .catch(err => console.error("error getting all pixels", err));
  }

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
