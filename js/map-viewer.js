// import * from "./leaflet/leaflet.min.js";
// var L = import("./leaflet/leaflet.min.js");
"use strict";

class MapViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.selectedLayers = [];
  }

  connectedCallback() {
    this.defineAttributes();
    this.initTag();
    this.initMap();
    if (this.baseLayersUrl) {
      this.initBaseLayers();
    } else {
      this.initDefaultLayer();
    }
    this.initOverlays();
  }

  defineAttributes() {
    this.lat = parseFloat(this.getAttributeOrDefault("lat", "51.505"));
    this.lng = parseFloat(this.getAttributeOrDefault("lng", "-0.09"));
    this.zoom = parseInt(this.getAttributeOrDefault("zoom", "3"));
    this.baseLayersUrl = this.getAttributeOrDefault("base-layers-url", "");
    this.overlaysUrl = this.getAttributeOrDefault("overlays-url", "");
    this.theme = this.getAttributeOrDefault("theme", "#313131");
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
    const style = document.createElement("style");
    style.textContent = `
    .leaflet-popup-content-wrapper, .leaflet-popup-tip, .leaflet-control, .leaflet-control a{
      background-color: ${this.theme} !important;
      color: ${this.contrastingColor(this.theme)} !important;
      border-color: ${this.contrastingColor(this.theme)}70 !important;
    }
    .leaflet-control-layers-toggle{
      background-image: url(./images/layers-${
        this.contrastingColor(this.theme) === "#000000" ? "black" : "white"
      }.svg) !important;
      width: 30px !important;
      height: 30px !important;
    }`;

    this.shadowRoot.appendChild(style);

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "./css/leaflet.min.css";
    this.shadowRoot.appendChild(cssLink);
  }

  initMap() {
    const mapDiv = document.createElement("div");
    mapDiv.id = "map";
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";
    mapDiv.style.backgroundColor = this.theme;
    mapDiv.style.cursor = "pointer";
    this.shadowRoot.appendChild(mapDiv);

    let mapOptions = {
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      minZoom: 3,
      maxZoom: 8,
    };

    this.map = L.map(mapDiv, mapOptions).setView(
      [this.lat, this.lng],
      this.zoom
    );

    this.map.on("click", (e) => this.mapClicked(e.latlng));

    this.map.zoomControl.setPosition("bottomright");
    this.layersControl = L.control.layers().addTo(this.map);
  }

  mapClicked(latlng, feature){
    if (feature || this.selectedLayers.length > 0) {
      const data = {latlng: latlng};
      if (feature) {
        data.feature = feature;
      }
      if (this.selectedLayers.length > 0) {
        data.feature = feature;
      }
      this.emit('map-clicked', data);
    }
  }

  initDefaultLayer() {

    let color = this.contrastingColor(this.theme);

    var geojsonOptions = {
      fillColor: color,
      color: color,
      weight: 1,
      opacity: 0,
      fillOpacity: 0.4,
    };

    fetch("./map/world.json")
      .then((resp) => resp.json())
      .then((json) => {
        L.geoJSON(json, geojsonOptions).addTo(this.map);
      });
  }

  initOverlays() {
    if (this.overlaysUrl) {
      fetch(this.overlaysUrl)
        .then((resp) => resp.json())
        .then((json) =>
          json.forEach((layerConf) => {
            if (layerConf.type === "wms") {
              this.addWmsLayer(layerConf);
            } else if (layerConf.type === "geojson") {
              this.loadGeoJsonData(layerConf);
            }
          })
        );
    }
  }

  addWmsLayer(layerConfig) {
    if (layerConfig) {
      const wmsLayer = L.tileLayer.wms(layerConfig.url, layerConfig.options);
      wmsLayer.on("add", _=>{
        this.selectedLayers.push(layerConfig);
        this.emit('layer-added', {selectedLayers:[layerConfig]})
      });
      wmsLayer.on("remove", _=> this.selectedLayers.splice(this.selectedLayers.indexOf(layerConfig)));
      wmsLayer.setOpacity(layerConfig.opacity);
      
      this.layersControl.addBaseLayer(wmsLayer, layerConfig.name);
      if (layerConfig.active) {
        this.map.addLayer(wmsLayer);
      }
    }
  }

  emit(eventName, data) {
    console.log('pippo');
    const event = new CustomEvent(eventName, { detail: data, bubbles: true });
    this.dispatchEvent(event);
  }

  loadGeoJsonData(layerConfig) {
    if (layerConfig.url) {
      fetch(layerConfig.url)
        .then((resp) => resp.json())
        .then((json) => this.createGeoJsonLayer(json, layerConfig));
    }
  }

  createGeoJsonLayer(data, layerConfig) {
    if (data) {
      const options = {
        onEachFeature: (feature, layer) =>
          this.onEachFeature(feature, layer, layerConfig),
      };

      if (layerConfig.markerOptions) {
        options.pointToLayer = (feature, latlng) =>
          L.circleMarker(latlng, layerConfig.markerOptions);
      }

      if (layerConfig.style) {
        options.style = layerConfig.style;
      }

      const geoJsonLayer = L.geoJSON(data, options);
      geoJsonLayer.on("add", _ => this.selectedLayers.push(layerConfig));
      geoJsonLayer.on("add", _ => this.selectedLayers.splice(this.selectedLayers.indexOf(layerConfig)));

      this.layersControl
        .addBaseLayer(geoJsonLayer, layerConfig.name)
        

      if (layerConfig.active) {
        geoJsonLayer.addTo(this.map);
      }
    }
  }

  onEachFeature(feature, layer, layerConfig) {
    if (
      feature.properties &&
      layerConfig.popupProperties &&
      layerConfig.popupProperties.length > 0
    ) {
      layer.on('click', e => this.mapClicked(e.latlng, feature));
      const container = document.createElement("div");
      layerConfig.popupProperties.forEach((popupProperty) => {
        const span = document.createElement("span");
        span.innerHTML = `<b>${popupProperty.label}</b>: ${
          feature.properties[popupProperty.name]
        }<br>`;
        container.appendChild(span);
      });
      layer.bindPopup(container);
    }
  }

  layerClicked(e, layerConfig) {
    console.log(
      "file: map-viewer.js ~ line 193 ~ MapViewer ~ layerClicked ~ layerConfig",
      layerConfig
    );
    console.log(
      "file: map-viewer.js ~ line 193 ~ MapViewer ~ layerClicked ~ e",
      e
    );
  }

  fromStringToRGB(str) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = str;
    const hexCode = ctx.fillStyle.replace("#", "");
    var aRgbHex = hexCode.match(/.{1,2}/g);
    var aRgb = [
      parseInt(aRgbHex[0], 16),
      parseInt(aRgbHex[1], 16),
      parseInt(aRgbHex[2], 16),
    ];
    return aRgb;
  }

  contrastingColor(color) {
    return this.luma(color) >= 165 ? "#000000" : "#ffffff";
  }

  luma(color) {
    const rgb = this.fromStringToRGB(color);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
}

customElements.define("map-viewer", MapViewer);
