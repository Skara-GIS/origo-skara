import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import CircleStyle from 'ol/style/Circle';
import MultiPoint from 'ol/geom/MultiPoint';
import { getUid } from 'ol/util';

const FILL_ALPHA = 0.5;
const BORDER_COLOR = 'rgb(72,72,72)';
const PATTERN_COLOR = '#000000';
const PATTERN_SPACING = 13;

const colors = {
  bostader: [253, 253, 49],
  handel: [203, 151, 101],
  offentlig: [253, 59, 0],
  verksamhet: [101, 151, 203],
  besok: [253, 151, 49],
  trafik: [127, 127, 127],
  parkering: [173, 173, 173],
  odling: [151, 203, 101],
  gata: [209, 209, 209],
  parkeringAllman: [219, 219, 219],
  gron: [151, 253, 151],
  vatten: [49, 151, 253],
  ovrigt: [230, 215, 190]
};

const kvartersmark = {
  Bostäder: ['B', colors.bostader],
  Centrum: ['C', colors.handel],
  Vård: ['D', colors.offentlig],
  'Tekniska anläggningar': ['E', colors.verksamhet],
  Drivmedel: ['G', colors.trafik],
  Detaljhandel: ['H', colors.handel],
  Industri: ['J', colors.verksamhet],
  Kontor: ['K', colors.handel],
  'Odling och djurhållning': ['L', colors.odling],
  'Friluftsliv och camping': ['N', colors.gron],
  'Tillfällig vistelse': ['O', colors.handel],
  Parkering: ['P', colors.parkering],
  Besöksanläggningar: ['R', colors.besok],
  Skola: ['S', colors.offentlig],
  Trafik: ['T', colors.trafik],
  Verksamheter: ['Z', colors.verksamhet]
};

const allmanPlats = {
  Gata: ['GATA', colors.gata],
  Väg: ['VÄG', colors.gata],
  Torg: ['TORG', colors.gata],
  'Gång- och cykelväg': ['GC-VÄG', colors.gata],
  Gångväg: ['GÅNG', colors.gata],
  Cykelväg: ['CYKEL', colors.gata],
  'Annan allmän plats': ['PLATS', colors.gata],
  Parkering: ['PARKERING', colors.parkeringAllman],
  Natur: ['NATUR', colors.gron],
  Park: ['PARK', colors.gron],
  Skydd: ['SKYDD', colors.gron],
  Plantering: ['PLANTERING', colors.gron]
};

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function getPlanbestammelse(feature) {
  return feature.get('planbestammelse') || {};
}

function getAnvandning(feature) {
  const pb = getPlanbestammelse(feature);
  const kategori = pb.kategori || '';
  if (pb.anvandningsform === 'Vattenområde' || /vatten/i.test(kategori)) {
    return { code: 'W', color: colors.vatten, allman: false };
  }
  if (pb.anvandningsform === 'Allmän plats') {
    const def = allmanPlats[kategori];
    return def ? { code: def[0], color: def[1], allman: true } : { code: kategori.toUpperCase(), color: colors.gata, allman: true };
  }
  const def = kvartersmark[kategori];
  return def ? { code: def[0], color: def[1], allman: false } : { code: kategori.charAt(0).toUpperCase(), color: colors.ovrigt, allman: false };
}

function createPattern(draw) {
  const pixelRatio = window.devicePixelRatio || 1;
  const size = Math.round(PATTERN_SPACING * pixelRatio);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = PATTERN_COLOR;
  context.strokeStyle = PATTERN_COLOR;
  draw(context, size, pixelRatio);
  return context.createPattern(canvas, 'repeat');
}

// Prickmark: svarta prickar i rutnät
function dotPattern() {
  return createPattern((context, size, pixelRatio) => {
    context.beginPath();
    context.arc(size / 2, size / 2, 1.6 * pixelRatio, 0, 2 * Math.PI);
    context.fill();
  });
}

// Korsmark: plustecken i rutnät
function crossPattern() {
  return createPattern((context, size, pixelRatio) => {
    const c = size / 2;
    const arm = 3.5 * pixelRatio;
    context.lineWidth = 1.2 * pixelRatio;
    context.beginPath();
    context.moveTo(c - arm, c);
    context.lineTo(c + arm, c);
    context.moveTo(c, c - arm);
    context.lineTo(c, c + arm);
    context.stroke();
  });
}

const transparentFill = new Fill({ color: 'rgba(255,255,255,0.01)' });
const anvandningsgrans = new Stroke({ color: BORDER_COLOR, width: 1.2 });
const egenskapsgrans = new Stroke({ color: BORDER_COLOR, width: 1.2, lineDash: [12, 3, 2, 3] });

function geometryKey(geometry) {
  const extent = geometry.getExtent().map(v => Math.round(v * 10)).join(',');
  const area = typeof geometry.getArea === 'function' ? Math.round(geometry.getArea()) : 0;
  return `${extent}|${area}`;
}

function anvandningStyle({ labelMaxResolution = 1.5 } = {}) {
  const groups = new Map();
  const fillCache = {};
  let refreshTimer;

  function getFill(color) {
    const key = color.join(',');
    if (!fillCache[key]) {
      fillCache[key] = new Fill({ color: rgba(color, FILL_ALPHA) });
    }
    return fillCache[key];
  }

  function scheduleRefresh(features) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => features.forEach(f => f.changed()), 0);
  }

  function register(feature, info) {
    const key = geometryKey(feature.getGeometry());
    let group = groups.get(key);
    if (!group) {
      group = new Map();
      groups.set(key, group);
    }
    if (!group.has(feature)) {
      const others = [...group.keys()];
      group.set(feature, info);
      if (others.length) scheduleRefresh(others);
    }
    return group;
  }

  return function styles(feature, resolution) {
    const geometry = feature.getGeometry();
    if (!geometry) return null;
    const type = geometry.getType();
    if (type !== 'Polygon' && type !== 'MultiPolygon') return null;

    const info = getAnvandning(feature);
    const group = register(feature, info);
    const members = [...group.entries()].sort((a, b) => a[1].code.localeCompare(b[1].code, 'sv') || (Number(getUid(a[0])) - Number(getUid(b[0]))));
    if (members[0][0] !== feature) {
      return new Style({ fill: transparentFill });
    }
    const codes = [...new Set(members.map(m => m[1].code))];
    const style = new Style({
      fill: getFill(info.color),
      stroke: anvandningsgrans
    });
    if (resolution <= labelMaxResolution) {
      style.setText(new Text({
        text: codes.join(' '),
        font: info.allman ? '11px Arial, sans-serif' : '12px Arial, sans-serif',
        fill: new Fill({ color: '#000000' }),
        overflow: true
      }));
    }
    return style;
  };
}

function pointsAlongLine(coordinates, spacing) {
  const points = [];
  let carry = spacing / 2;
  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    let d = carry;
    while (d <= length) {
      const t = d / length;
      points.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
      d += spacing;
    }
    carry = d - length;
  }
  return points;
}

function egenskapStyle() {
  const prickmark = new Style({ fill: new Fill({ color: dotPattern() }), stroke: egenskapsgrans, zIndex: 2 });
  const korsmark = new Style({ fill: new Fill({ color: crossPattern() }), stroke: egenskapsgrans, zIndex: 2 });
  const ovrig = new Style({ fill: transparentFill, stroke: egenskapsgrans, zIndex: 1 });
  const linje = new Style({ stroke: new Stroke({ color: PATTERN_COLOR, width: 1 }), zIndex: 3 });
  const ring = new CircleStyle({
    radius: 4,
    fill: new Fill({ color: 'rgba(255,255,255,0.01)' }),
    stroke: new Stroke({ color: PATTERN_COLOR, width: 1.5 })
  });

  return function styles(feature, resolution) {
    const geometry = feature.getGeometry();
    if (!geometry) return null;
    const type = geometry.getType();
    const pb = getPlanbestammelse(feature);
    const underkategori = pb.underkategori || '';

    if (type === 'LineString' || type === 'MultiLineString') {
      const lines = type === 'LineString' ? [geometry.getCoordinates()] : geometry.getCoordinates();
      const points = lines.reduce((acc, line) => acc.concat(pointsAlongLine(line, 14 * resolution)), []);
      return [linje, new Style({ geometry: new MultiPoint(points), image: ring, zIndex: 3 })];
    }
    if (type !== 'Polygon' && type !== 'MultiPolygon') return null;
    if (/^marken får inte förses med byggnadsverk/i.test(underkategori)) return prickmark;
    if (/^marken får endast förses med/i.test(underkategori)) return korsmark;
    return ovrig;
  };
}

export default function ngpDetaljplanStyle(params = {}) {
  if (params.type === 'egenskap') {
    return egenskapStyle(params);
  }
  return anvandningStyle(params);
}
