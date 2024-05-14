import Point from 'ol/geom/Point'; // SKA for multipoint support when cluster style is used
import EsriJSON from 'ol/format/EsriJSON';
import VectorSource from 'ol/source/Vector';
import * as loadingstrategy from 'ol/loadingstrategy';
import vector from './vector';
import replacer from '../utils/replacer';

function createSource({
  attribution,
  id,
  filter,
  projectionCode,
  url: sourceUrl
} = {}) {
  const layerFilter = replacer.replace(filter, window);

  const esriSrs = projectionCode.split(':').pop();
  const queryFilter = layerFilter ? `&where=${layerFilter}` : '';
  const esrijsonFormat = new EsriJSON();
  const vectorSource = new VectorSource({
    attributions: attribution,
    loader(extent, resolution, projection, success) {
      const that = this;
      let url = sourceUrl.endsWith('/') ? sourceUrl : `${sourceUrl}/`;
      url += id
        + encodeURI(['/query?f=json&',
          'returnGeometry=true',
          '&spatialRel=esriSpatialRelIntersects',
          `&geometry={"xmin":${extent[0]},"ymin":`,
          `${extent[1]},"xmax":${extent[2]},"ymax":${extent[3]}`,
          `,"spatialReference":{"wkid":${esriSrs}}`,
          '&geometryType=esriGeometryEnvelope',
          `&inSR=${esriSrs}&outFields=*`,
          '&returnIdsOnly=false&returnCountOnly=false',
          '&geometryPrecision=2',
          `&outSR=${esriSrs}${queryFilter}`].join(''));
      // SKA for multipoint support when cluster style is used
      fetch(url)
        .then(response => response.json())
        .then((data) => {
          const features = esrijsonFormat.readFeatures(data, {
            featureProjection: projection
          });
          if (features.length > 0) {
            features.forEach(feature => {
              if (feature.getGeometry().getType() === 'MultiPoint') {
                const coordinates = feature.getGeometry().getCoordinates();
                const pointGeometry = new Point(coordinates[0]);
                feature.setGeometry(pointGeometry);
              }
              that.addFeature(feature);
            });
          }
        }).catch(error => console.warn(error));
    // SKA for multipoint support when cluster style is used
    },
    strategy: loadingstrategy.bbox
  });
  return vectorSource;
}

const agsFeature = function agsFeature(layerOptions, viewer) {
  const agsDefault = {
    layerType: 'vector'
  };
  const sourceDefault = {};
  const agsOptions = Object.assign(agsDefault, layerOptions);
  const sourceOptions = Object.assign(sourceDefault, viewer.getMapSource()[layerOptions.sourceName]);
  sourceOptions.geometryName = agsOptions.geometryName;
  sourceOptions.filter = agsOptions.filter;
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.id = agsOptions.id;

  const agsSource = createSource(sourceOptions);
  return vector(agsOptions, agsSource, viewer);
};

export default agsFeature;
