import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

const BLUE_COLOR = '#1d5d8c';
const STROKE_WIDTH = 3;

function getDotPattern() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pixelRatio = window.devicePixelRatio || 1;
  const size = 16 * pixelRatio;

  canvas.width = size;
  canvas.height = size;

  context.fillStyle = BLUE_COLOR;
  const radius = 2 * pixelRatio;

  context.beginPath();
  context.arc(size / 4, size / 4, radius, 0, 2 * Math.PI);
  context.fill();

  context.beginPath();
  context.arc((3 * size) / 4, (3 * size) / 4, radius, 0, 2 * Math.PI);
  context.fill();

  return context.createPattern(canvas, 'repeat');
}

const dotFill = new Fill({ color: getDotPattern() });
const polygonStroke = new Stroke({ color: BLUE_COLOR, width: STROKE_WIDTH });

export default function ritlagerStyle() {
  return function styles(feature) {
    const geometryType = feature.getGeometry().getType();

    if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      return new Style({
        fill: dotFill,
        stroke: polygonStroke,
        zIndex: 30
      });
    }
    return null;
  };
}
