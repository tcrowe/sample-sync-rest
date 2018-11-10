import * as DCL from "decentraland-api";
import { Vector3Component } from "decentraland-api";

interface IState {
  paletteColor: string;
  wallBlockColors: string[];
}

const wallBlocksX: number = 16;
const wallBlocksY: number = 8;
const wallWidth = 9;
const wallHeight = 4.5;
const wallOffsetX = 0.75;
const wallOffsetY = 0.5;
const wallPixelPrefix = "wall-pixel-";
const wallPixelZ = 5;

const wallPixelScale: Vector3Component = {
  x: wallWidth / wallBlocksX - 0.01,
  y: wallHeight / wallBlocksY - 0.01,
  z: 0.05
};

const palettePixelPrefix = "palette-pixel-";
const paletteScale = { x: 0.16, y: 0.16, z: 0 };
const palettePositionX = 0.05;
const pound = "#";

/*

Color list

Source:
https://www.patternfly.org/styles/color-palette/

+ some are commented to get the entity count down

*/
const paletteColorList = [
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
  null
];

const paletteColorListNoPound = paletteColorList.map(function(color) {
  if (color === null) {
    return null;
  }

  return color.replace(pound, "");
});

const paletteColorTransition = {
  position: {
    duration: 300
  }
};

const blankColor = "#0099CC";

const wallPixelBlankMaterial = (
  <material
    id="wall-pixel-blank-material"
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

interface IPixelHashTable {
  [key: string]: string;
}

const wallPixelPositions: IPixelHashTable = {};
const wallPixelColorsInit: IPixelHashTable = {};
let wallBlockIndex = 0;

for (let xIndex = 0; xIndex < wallBlocksX; xIndex += 1) {
  for (let yIndex = 0; yIndex < wallBlocksY; yIndex += 1) {
    const key = `${xIndex}-${yIndex}`;
    const x = (wallWidth / wallBlocksX) * xIndex + wallOffsetX;
    const y = (wallHeight / wallBlocksY) * yIndex + wallOffsetY;
    wallPixelPositions[key] = { x, y, z: wallPixelZ };
    wallBlockIndex += 1;
    wallPixelColorsInit[key] = null;
  }
}

export default class HttpScene extends DCL.ScriptableScene<any, IState> {
  public state: IState = {
    paletteColor: null,
    wallBlockColors: wallPixelColorsInit
  };

  private wallPixelClick(evt: any): void {
    console.log("wallPixelClick", evt);
    /*const { paletteColor, wallBlockColors } = this.state;
    const [x, y] = elementId.replace(wallPixelPrefix, "").split("-");
    const key = `${x}-${y}`;

    fetch(`${apiUrl}/pixel/?x=${x}&y=${y}`)
      .then(res => res.json())
      .then(function(res) {
        console.log("res", res)
      })
      .catch(err => console.error("error getting single pixel", err));*/
  }

  private paletteClick(evt: any): void {
    console.log("paletteClick", evt);
    /*const paletteColor = "#" + elementId.split("-")[1];
    console.log("paletteColor", paletteColor)
    this.setState({ paletteColor });*/
  }

  private drawPalette(): DCL.ISimplifiedNode[] {
    const scene = this;
    console.log("scene", scene);
    const { paletteColor } = scene.state;
    const palettePosition = { x: 0, y: 0, z: -0.01 };

    const bg = (
      <plane
        id="palette-background"
        scale={{ x: 2.2, y: 1, z: 0.1 }}
        color="#666666"
      />
    );

    let rowY = 0;

    const paletteColors = paletteColorList.map(function(color, index) {
      // in the id it uses the same color but without the pound sign
      const id = `${palettePixelPrefix}-${paletteColorListNoPound[index]}`;
      const x = ((index % 12) + 1) / 6 - 1.08;
      if (index % 12 === 0) {
        rowY -= 0.17;
      }
      const y = rowY + 0.5;
      const z = color === paletteColor ? -0.02 : -0.01;
      const position = { x, y, z };

      if (color === null) {
        return (
          <plane
            id={`${palettePixelPrefix}-transparent`}
            material="#transparent-material"
            position={position}
            scale={paletteScale}
            transition={paletteColorTransition}
          />
        );
      }

      return (
        <plane
          id={id}
          position={position}
          scale={paletteScale}
          color={color}
          transition={paletteColorTransition}
        />
      );
    });

    const paletteContainer = (
      <entity
        id="palette-container"
        position={{ x: 8.5, y: 1, z: 3 }}
        rotation={{ x: 30, y: 50, z: 0 }}
      />
    );

    paletteContainer.children = paletteContainer.children
      .concat(bg)
      .concat(paletteColors);

    return paletteContainer;
  }

  private drawWallPixels(): DCL.ISimplifiedNode[] {
    const scene = this;
    const { wallBlockColors } = this.state;

    return Object.keys(wallBlockColors).map(function(key) {
      const id = `${wallPixelPrefix}-${key}`;
      const position = wallPixelPositions[key];
      const color = wallBlockColors[key];

      if (color === undefined || color === null) {
        return (
          <plane
            id={id}
            position={position}
            scale={wallPixelScale}
            material="#wall-pixel-blank-material"
          />
        );
      }

      return (
        <plane
          id={id}
          position={position}
          scale={wallPixelScale}
          color={color}
        />
      );
    });
  }

  public sceneDidMount(): void {
    const scene = this;

    scene.eventSubscriber.on("click", function(evt) {
      const { elementId } = evt.data;

      console.log("elementId", elementId);

      if (elementId.startsWith(wallPixelPrefix) === true) {
        console.log("wall pixel click");
        // scene.wallPixelClick(elementId);
      }

      if (elementId.startsWith(palettePixelPrefix) === true) {
        console.log("palette pixel click");
        // scene.paletteClick(elementId);
      }
    });

    /*fetch(apiUrl)
      .then(res => res.json())
      .then(function(res) {
        console.log("res", res);
      })
      .catch(err => console.error("error getting all pixels", err));*/
  }

  public async render() {
    return (
      <scene id="sample-sync-rest">
        {wallPixelBlankMaterial}
        {transparentMaterial}
        {this.drawPalette()}
        {this.drawWallPixels()}
      </scene>
    );
  }
}
