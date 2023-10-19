import Vector3 from "./Vector3";

export default class Face4 {

    constructor(a, b, c, d, normal, material) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    
        this.centroid = new Vector3();
        this.normal = normal instanceof Vector3 ? normal : new Vector3();
        this.vertexNormals =  normal instanceof Array ? normal : [];
    
        this.material = material instanceof Array ? material : [ material ];
    }

    toString() {
        return 'MTHREE.Face4 ( ' + this.a + ', ' + this.b + ', ' + this.c + ' ' + this.d + ' )';
    }

}