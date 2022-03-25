'use strict'


class LogoMenu extends HTMLElement {



  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.defineAttributes();
    this.initTag()
  }

  defineAttributes() {
    this.imageUrl = this.getAttributeOrDefault('image-url', "");
    this.backgroundColor = this.getAttributeOrDefault('background-color', 'white');
    this.width = this.getAttributeOrDefault('width', '60px');
    this.maxWidth = this.getAttributeOrDefault('max-width', '30vw');
    this.href = this.getAttributeOrDefault('href', '/');
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
    container.style.backgroundColor = this.backgroundColor || 'transparent';
    container.style.padding = '4px';
    container.style.borderRadius = '4px';
    container.style.maxWidth = this.maxWidth;
    container.style.width = this.width;
    container.style.cursor = 'pointer';

    //console.log(document.referrer);

    const image = document.createElement('img');
    image.src = this.imageUrl;
    image.style.width = '100%';
    image.style.height = '100%';
    image.addEventListener('click', () => window.location.href = this.href);

    container.appendChild(image);

    this.shadowRoot.appendChild(container);
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




customElements.define('logo-menu', LogoMenu);