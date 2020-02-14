/* eslint googshift/valid-provide-and-module: 0 */





const ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});


// eslint-disable-line no-unused-vars
window.manager = new olcs.contrib.Manager(window.CESIUM_URL, {map: ol2d});
