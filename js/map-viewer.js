class MapViewer extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.defineAttributes();
    this.initTag()
    this.initMap()
    if (this.baseLayersUrl) {
      this.initBaseLayers()
    } else {
      this.initDefaultLayer()
    }
    //sthis.initWmsOverlays()
    this.initGeoJSONOverlays()
  }

  defineAttributes() {
    this.lat = this.getAttributeOrDefault('lat', '51.505');
    this.lng = this.getAttributeOrDefault('lng', '-0.09');
    this.zoom = this.getAttributeOrDefault('zoom', '3');
    this.baseLayersUrl = this.getAttributeOrDefault('base-layers-url', "");
    this.wmsOverlaysUrl = this.getAttributeOrDefault('wms-overlays-url', "");
    this.geoJSONOverlaysUrl = this.getAttributeOrDefault('geo-json-overlays-url', "");
    this.theme = this.getAttributeOrDefault('theme', '#313131');
  }

  getAttributeOrDefault(attribute, defaultValue) {
    if (this.hasAttribute(attribute)) {
      return this.getAttribute(attribute);
    } else {
      this.setAttribute(attribute, defaultValue);
      return defaultValue;
    }
  }

  initTag() {

    this.style.height = '100%';
    this.style.width = '100%';


    const style = document.createElement('style');
    style.textContent = `
    .leaflet-control, .leaflet-control a{
      background-color: ${this.theme} !important;
      color: ${this.contrastingColor(this.theme)} !important;
      border-color: ${this.contrastingColor(this.theme)}70 !important;
    }`

    this.shadowRoot.appendChild(style);

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = './css/leaflet.min.css';
    this.shadowRoot.appendChild(cssLink);

  }

  initMap() {

    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapDiv.style.width = '100%';
    mapDiv.style.height = '100%';
    mapDiv.style.backgroundColor = this.theme;
    this.shadowRoot.appendChild(mapDiv);

    let mapOptions = {
      maxBounds: [[-90, -180], [90, 180]],
      minZoom: 3,
      maxZoom: 8
    }

    this.map = L.map(mapDiv, mapOptions).setView([this.lat, this.lng], this.zoom);

    this.map.zoomControl.setPosition('bottomright');

  }


  initDefaultLayer() {

    const defaultColor = "#03d6f1"
    let color = this.contrastingColor(this.theme);

    var geojsonOptions = {
      fillColor: color,
      color: color,
      weight: 1,
      opacity: 0,
      fillOpacity: 0.4
    };

    fetch("./map/world.json")
      .then(resp => resp.json())
      .then(json => {
        console.log(json)
        L.geoJSON(json, geojsonOptions).addTo(this.map);
      });
  }

  initWmsOverlays() {
    if (this.wmsOverlaysUrl) {
      fetch(this.wmsOverlaysUrl)
        .then(resp => resp.json())
        .then(json => json.forEach(layerConf => this.createWmsLayer(layerConf)));
    }
  }

  createWmsLayer(layerConfig){
    if (layerConfig) {
      const wmsLayer = L.tileLayer.wms(layerConfig.url, layerConfig.options);
      wmsLayer.setOpacity(layerConfig.opacity);
      wmsLayer.addTo(this.map);
    }
  }


  initGeoJSONOverlays() {
    if (this.geoJSONOverlaysUrl) {
      fetch(this.geoJSONOverlaysUrl)
        .then(resp => resp.json())
        .then(json => json.forEach(layerConf => this.loadGeoJsonData(layerConf)));
    }
  }

  loadGeoJsonData(layerConfig){
    if (layerConfig.url) {
      fetch(layerConfig.url)
        .then(resp => resp.json())
        .then(json => this.createGeoJsonLayer(json,layerConfig))
    }
  }

  createGeoJsonLayer(data, layerConfig){
    if (data) {
      const options = { pointToLayer: (feature, latlng) => Function(layerConfig.pointToLayer)(feature, latlng) };
   
      const geoJsonLayer = L.geoJSON(data);
     
      geoJsonLayer.addTo(this.map);
    }
  }

  fromStringToRGB(str){
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = str;
    const hexCode = ctx.fillStyle.replace("#", "");
    var aRgbHex = hexCode.match(/.{1,2}/g);
    var aRgb = [
        parseInt(aRgbHex[0], 16),
        parseInt(aRgbHex[1], 16),
        parseInt(aRgbHex[2], 16)
    ];
    return aRgb;
  }

  contrastingColor(color)
  {
    return (this.luma(color) >= 165) ? '#000000' : '#ffffff';
  }

  luma(color)
  { 
    const rgb = this.fromStringToRGB(color);
    return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); 
  }


}




customElements.define('map-viewer', MapViewer);