
export default class Vector3 {

    constructor(x, y, z) {

      this.x = x || 0;
      this.y = y || 0;
      this.z = z || 0;

    }

    set(x, y, z) {

      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    copy( v ) {

      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
  
      return this;
  
    }
    
    add(v1, v2) {

      this.x = v1.x + v2.x;
      this.y = v1.y + v2.y;
      this.z = v1.z + v2.z;

      return this;
    }

    addSelf(v) {

      this.x += v.x;
      this.y += v.y;
      this.z += v.z;

      return this;
    }

    addScalar(s) {

      this.x += s;
      this.y += s;
      this.z += s;

      return this;
    }

    sub(v1, v2) {

      this.x = v1.x - v2.x;
      this.y = v1.y - v2.y;
      this.z = v1.z - v2.z;

      return this;
    }

    subSelf(v) {

      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;

      return this;
    }

    cross(v1, v2) {

      this.x = v1.y * v2.z - v1.z * v2.y;
      this.y = v1.z * v2.x - v1.x * v2.z;
      this.z = v1.x * v2.y - v1.y * v2.x;

      return this;
    }

    crossSelf(v) {

      var tx = this.x, ty = this.y, tz = this.z;

      this.x = ty * v.z - tz * v.y;
      this.y = tz * v.x - tx * v.z;
      this.z = tx * v.y - ty * v.x;

      return this;
    }

    multiplySelf(v) {

      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;

      return this;
    }

    multiplyScalar(s) {

      this.x *= s;
      this.y *= s;
      this.z *= s;

      return this;
    }

    divideScalar(s) {

      this.x /= s;
      this.y /= s;
      this.z /= s;

      return this;
    }

    dot(v) {

      return this.x * v.x + this.y * v.y + this.z * v.z;

    }

    distanceTo(v) {

      return Math.sqrt( this.distanceToSquared( v ) );

    }

    distanceToSquared(v) {

      var dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
		  return dx * dx + dy * dy + dz * dz;
    
    }

    length() {

      return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

    }

    lengthSq() {

      return this.x * this.x + this.y * this.y + this.z * this.z;

    }

    negate() {

      this.x = - this.x;
      this.y = - this.y;
      this.z = - this.z;

      return this;
    }

    normalize() {

      if ( this.length() > 0 ) {

        this.multiplyScalar( 1 / this.length() );
  
      } else {
  
        this.multiplyScalar( 0 );
  
      }

      return this;
    }

    setLength(len) {

      return this.normalize().multiplyScalar( len );
      
    }

    isZero()  {

      var almostZero = 0.0001;
      return ( Math.abs( this.x ) < almostZero ) && ( Math.abs( this.y ) < almostZero ) && ( Math.abs( this.z ) < almostZero );

    }

    clone() {

      return new Vector3( this.x, this.y, this.z );

    }

    toString() {

      return 'MTHREE.Vector3 ( ' + this.x + ', ' + this.y + ', ' + this.z + ' )';
      
    }
}