'use strict'


class MapLegend extends HTMLElement {



  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.defineAttributes();
    this.initTag()
  }

  defineAttributes() {
    this.min = parseFloat(this.getAttributeOrDefault('min', '0'));
    this.max = parseFloat(this.getAttributeOrDefault('max', '10'));
    this.isLog = this.getAttributeOrDefault('log', 'false') === 'true';
    this.isVertical = this.getAttributeOrDefault('vertical', 'false') === 'true';
    this.colors = this.getAttributeOrDefault('colors', '#000000,#222222,#444444,#666666,#888888,#AAAAAA,#CCCCCC,#EEEEEE').split(',');
    this.unit = this.getAttributeOrDefault('unit', '');
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

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
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
      if (i === 0 || i === this.colors.length - 1) {
        const text = this.roundTo(this.getStep(this.min, this.max, this.colors.length, this.isLog, i), 1) + ' ' + this.unit;
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




  getStep(min, max, stepNumber, isLog, index) {
    if (isLog) {
      const minLog = Math.log(min);
      const maxLog = Math.log(max);
      const step = (maxLog - minLog) / (stepNumber - 1);
      return Math.exp(minLog + step * index);
    } else {
      console.log('pippo', ((max - min) / (stepNumber - 1)) * index)
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