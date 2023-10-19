import Object3D from "./Object3D";

export default class Line extends Object3D {

    constructor(geometry, material) {
        super(material)

        this.geometry = geometry;
        this.material = material instanceof Array ? material : [ material ];
    }
}