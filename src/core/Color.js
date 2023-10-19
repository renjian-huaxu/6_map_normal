
export default class Color {

  // __styleString = 'rgba(0, 0, 0, 1)'

  constructor(hex) {

    this.autoUpdate = true;
    this.setHex(hex);

  }

  setRGBA(r, g, b, a) {

    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;

    if (this.autoUpdate) {

      this.updateHex();
      this.updateStyleString();

    }
  }

  setHex(hex) {

    this.hex = (~~hex) & 0xffffff;

    if (this.autoUpdate) {

      this.updateRGBA();
      this.updateStyleString();

    }

  }

  updateHex() {
    this.hex = ~~(this.r * 255) << 16 ^ ~~(this.g * 255) << 8 ^ ~~(this.b * 255);
  }

  updateRGBA() {

    this.r = (this.hex >> 16 & 255) / 255;
    this.g = (this.hex >> 8 & 255) / 255;
    this.b = (this.hex & 255) / 255;

  }

  updateStyleString() {
    this.__styleString = 'rgb(' + ~~(this.r * 255) + ',' + ~~(this.g * 255) + ',' + ~~(this.b * 255) + ')';
  }

  toString() {
    return 'MTHREE.Color ( r: ' + this.r + ', g: ' + this.g + ', b: ' + this.b + ', hex: ' + this.hex + ' )';
  }
} 