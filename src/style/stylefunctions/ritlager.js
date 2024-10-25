import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';

export default function ritlagerStyle() {
  return function styles(feature) {
    const colorvalue = feature.get('farg') || '#000000';
    const opacity = parseFloat(feature.get('opacity')) || 0.8;

    // Convert HEX to RGB
    const rgbColor = colorvalue.charAt(0) === '#'
      ? colorvalue.match(/[A-Za-z0-9]{2}/g).map((val) => parseInt(val, 16))
      : [0, 0, 0];

    const fillcolor = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, ${opacity})`;
    const linecolor = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, ${opacity})`;
    const strokewidth = 3;
    const radius = 5;

    const fill = new Fill({
      color: fillcolor
    });
    const stroke = new Stroke({
      color: linecolor,
      width: strokewidth
    });

    const geometryType = feature.getGeometry().getType();
    let style;

    if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      style = new Style({
        image: new Circle({
          radius,
          fill,
          stroke
        }),
        zIndex: 50
      });
    } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
      style = new Style({
        stroke,
        zIndex: 40
      });
    } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      style = new Style({
        fill,
        stroke,
        zIndex: 30
      });
    }

    return style;
  };
}
