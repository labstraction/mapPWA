'use strict'


export class MapLegend extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  get min(){
    return parseFloat(this.getAttributeOrDefault('min'));
  }
  set min(value){
    this.setNewAttribute('min', value)
  }

  get max(){
    return parseFloat(this.getAttributeOrDefault('max', ''));
  }
  set max(value){
    this.setNewAttribute('max', value)
  }

  get isLog(){
    return this.getAttributeOrDefault('log', 'false') === 'true';
  }
  set isLog(value){
    this.setNewAttribute('log', value)
  }
  
  get unit(){
    return this.getAttributeOrDefault('unit', '');
  }
  set unit(value){
    this.setNewAttribute('unit', value)
  }
  
  get name(){
    return this.getAttributeOrDefault('name', 'x-rainbow');
  }
  set name(value){
    if (value) {this.setNewAttribute('name', value)}
  }

  get isVertical(){
    return this.getAttributeOrDefault('position', 'bottom') === 'left' 
        || this.getAttributeOrDefault('position', 'bottom') === 'right';
  }

  get isTop(){
    return this.getAttributeOrDefault('position', 'bottom') === 'top';
  }

  get isLeft(){
    return this.getAttributeOrDefault('position', 'bottom') === 'left';
  }

  get size(){
    return parseInt(this.getAttributeOrDefault('size', '18'));
  }

  getAttributeOrDefault(attribute, defaultValue) {
    if (this.hasAttribute(attribute)) {
      return this.getAttribute(attribute);
    } else if (defaultValue) {
      this.setAttribute(attribute, defaultValue);
      return defaultValue;
    }
  }

  setNewAttribute(attribute, newValue) {
    if(newValue !== this.getAttribute(attribute)){
      this.setAttribute(attribute, newValue);
    }
  }

  connectedCallback() {
    this.initComponent()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue ) {
      this[name] = newValue
      this.initComponent()
    }
    
  } 
  static get observedAttributes() { return ['min', 'max', 'isLog', 'name', 'unit']; }

  async initComponent() {

    this.shadowRoot.innerHTML = '';

    const palettes =  await fetch("./mapPWA/settings/palette.json").then(resp => resp.json()).catch(e => console.log(e));
    this.colors = palettes[this.name];
    if (!this.colors) {
      return;
    }

    const container = document.createElement('div');
    container.style.width = this.isVertical ? this.size + 'px' : '100%';
    container.style.height =this.isVertical ? '100%' : this.size + 'px';
    container.style.display = 'flex';
    container.style.flexDirection = this.isVertical ? 'column-reverse' : "row";

    for (let i = 0; i < this.colors.length; i++) {
      const span = document.createElement('span');
      span.style.backgroundColor = this.colors[i];
      span.style.color = this.contrastingColor(this.colors[i]);
      span.style.flexGrow = 1;
      span.style.display = 'flex';
      span.style.alignItems = 'center';
      span.style.justifyContent = 'center';
      span.style.fontSize = '0.6em';
      span.style.fontWeight = 'bold';

      let text = '';
      if (this.min !== undefined && this.max !== undefined) {
        text = this.roundTo(this.getStep(this.min, this.max, this.colors.length, this.isLog, i), 1) + (this.unit || '');
        span.addEventListener('mouseover', (e) => this.showTooltip(e, text, span.style.color, span.style.backgroundColor));
      }

      if (i === 0 || i === this.colors.length - 1) {
        span.appendChild(document.createTextNode(text));
        if (this.isVertical) {
          span.style.minHeight = '30px';
        } else {
          span.style.minWidth = '30px';
        }
      }
      container.appendChild(span);
    }
    this.shadowRoot.appendChild(container);
  }

  showTooltip(event, text, color, backgroundColor){
    if (document.getElementById('map-legend-tooltip')) {
      document.body.removeChild(document.getElementById('map-legend-tooltip'));
    }
    const tooltip = document.createElement('div');
    document.querySelector('body').appendChild(tooltip);
    tooltip.appendChild(document.createTextNode(text));
    
    tooltip.style.position = 'absolute';
    tooltip.style.position = 'absolute';
    tooltip.style.color = color;
    tooltip.style.backgroundColor = backgroundColor;
    tooltip.style.padding = "4px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.zIndex = 1000000;
    tooltip.id = 'map-legend-tooltip'
    const topOffset =  this.isTop ? tooltip.offsetHeight : (-tooltip.offsetHeight);
    const leftOffset =  this.isLeft ? tooltip.offsetWidth : (-tooltip.offsetWidth);
    tooltip.style.top = (this.isVertical ? (event.clientY - tooltip.offsetHeight / 2) : (event.clientY + topOffset))  + 'px';
    tooltip.style.left = (this.isVertical ? (event.clientX + leftOffset) : (event.clientX - tooltip.offsetWidth / 2)) + 'px';
    
    document.body.appendChild(tooltip);

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      if (document.getElementById('map-legend-tooltip')) {
        document.body.removeChild(document.getElementById('map-legend-tooltip'));
      }
    }, 1000);

  }

  getStep(min, max, stepNumber, isLog, index) {
    if (isLog) {
      const minLog = Math.log(min);
      const maxLog = Math.log(max);
      const step = (maxLog - minLog) / (stepNumber - 1);
      return Math.exp(minLog + step * index);
    } else {
      return ((max - min) / (stepNumber - 1)) * index;
    }
  }

  fromStringToRGB(str) {
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

  contrastingColor(color) {
    return (this.luma(color) >= 165) ? '#000000' : '#ffffff';
  }

  luma(color) {
    const rgb = this.fromStringToRGB(color);
    return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]);
  }

  roundTo(n, digits = 0) {
    var multiplicator = Math.pow(10, digits);
    n = n * multiplicator;
    return Math.round(n) / multiplicator;
  }

}

customElements.define('map-legend', MapLegend);