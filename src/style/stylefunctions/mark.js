import Fill from "ol/style/Fill";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";

const hatchCache = {};

export default function topo10Style() {
  return function styles(feature) {
    const objekttypnr = String(feature.get("objekttypnr"));

    const styleConfig = [
      {
        match: ["2631", "2632", "2633", "2634", "2635"],
        fillColor: "rgba(191, 239, 255, 1.0)",
        stroke: { color: "rgba(0, 166, 255, 1)", width: 1.0 },
        hatchUrl: "../img/svg/vatten.svg",
      },
      {
        match: ["2642", "2643"],
        fillColor: "rgba(255, 247, 166, 1.0)",
        stroke: { color: "rgba(213, 206, 138, 0.8)", width: 1.0 },
        hatchUrl: "../img/svg/aker.svg",
      },
      {
        match: ["2645"],
        fillColor: "rgba(212, 238, 183, 1.0)",
        stroke: {
          color: "rgba(46, 125, 50, 1)",
          width: 1.5,
          lineDash: [1, 12],
        },
        hatchUrl: "../img/svg/barrskog.svg",
      },
      {
        match: ["2646"],
        fillColor: "rgba(227, 247, 199, 1.0)",
        stroke: {
          color: "rgba(46, 125, 50, 1)",
          width: 1.5,
          lineDash: [1, 12],
        },
        hatchUrl: "../img/svg/lovskog.svg",
      },
    ];

    const cfg = styleConfig.find((c) => c.match.includes(objekttypnr));
    if (!cfg) return null;

    const stroke = cfg.stroke
      ? new Stroke({
          color: cfg.stroke.color,
          width: cfg.stroke.width,
          lineDash: cfg.stroke.lineDash || undefined,
        })
      : undefined;

    let fill = new Fill({ color: cfg.fillColor });

    if (cfg.hatchUrl) {
      if (!hatchCache[cfg.hatchUrl]) {
        const image = new Image();
        image.src = cfg.hatchUrl;

        image.onload = () => {
          const pixelRatio = window.devicePixelRatio || 1;
          const iconSize = 22 * pixelRatio;
          const hatchTileSize = 512 * pixelRatio;

          const canvas = document.createElement("canvas");
          canvas.width = hatchTileSize;
          canvas.height = hatchTileSize;
          const context = canvas.getContext("2d");

          context.fillStyle = cfg.fillColor;
          context.fillRect(0, 0, hatchTileSize, hatchTileSize);

          // Number of icons
          const numberOfIcons = 1;

          for (let i = 0; i < numberOfIcons; i++) {
            const x = Math.random() * (hatchTileSize - iconSize);
            const y = Math.random() * (hatchTileSize - iconSize);
            context.drawImage(image, x, y, iconSize, iconSize);
          }

          hatchCache[cfg.hatchUrl] = context.createPattern(canvas, "repeat");
          feature.changed();
        };
      }

      if (hatchCache[cfg.hatchUrl]) {
        fill = new Fill({ color: hatchCache[cfg.hatchUrl] });
      }
    }

    return new Style({
      fill,
      stroke,
    });
  };
}
