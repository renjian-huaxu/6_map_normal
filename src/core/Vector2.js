
export default class Vector2 {

  constructor(x, y) {

    this.x = x || 0;
    this.y = y || 0;

  }

  set(x, y) {

    this.x = x;
    this.y = y;

    return this;

  }

  copy(v) {

    this.x = v.x;
    this.y = v.y;

    return this;

  }

  addSelf(v) {

    this.x += v.x;
    this.y += v.y;

    return this;

  }

  add(v1, v2) {

    this.x = v1.x + v2.x;
    this.y = v1.y + v2.y;

    return this;

  }

  subSelf(v) {

    this.x -= v.x;
    this.y -= v.y;

    return this;

  }

  sub(v1, v2) {

    this.x = v1.x - v2.x;
    this.y = v1.y - v2.y;

    return this;

  }

  multiplyScalar(s) {

    this.x *= s;
    this.y *= s;
    
    return this;

  }

  unit() {

    this.multiplyScalar(1 / this.length());

  }

  length() {

    return Math.sqrt(this.x * this.x + this.y * this.y);

  }

  lengthSq() {

    return this.x * this.x + this.y * this.y;

  }

  negate() {

    this.x = - this.x;
    this.y = - this.y;
    return this;

  }

  clone() {

    return new Vector2(this.x, this.y);

  }

  toString() {
    return 'MTHREE.Vector2 (' + this.x + ', ' + this.y + ')';
  }
}