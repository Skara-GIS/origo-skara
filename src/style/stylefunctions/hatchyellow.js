import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

const HATCH_COLOR = '#ffeb3b';
const STROKE_WIDTH = 3;

function getHatchPattern() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pixelRatio = window.devicePixelRatio || 1;
  const size = 16 * pixelRatio;
  canvas.width = size;
  canvas.height = size;
  context.strokeStyle = HATCH_COLOR;
  context.lineWidth = STROKE_WIDTH * pixelRatio;
  context.lineCap = 'butt';
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(size, size);
  context.moveTo(-size, 0);
  context.lineTo(0, size);
  context.moveTo(size, 0);
  context.lineTo(2 * size, size);
  context.stroke();
  return context.createPattern(canvas, 'repeat');
}

const hatchFill = new Fill({ color: getHatchPattern() });
const polygonStroke = new Stroke({ color: HATCH_COLOR, width: STROKE_WIDTH });

export default function ritlagerStyle() {
  return function styles(feature) {
    const geometryType = feature.getGeometry().getType();

    if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      return new Style({
        fill: hatchFill,
        stroke: polygonStroke,
        zIndex: 30
      });
    }
    return null;
  };
}