
import Object3D from "./Object3D";

export default class Mesh extends Object3D {

    constructor(geometry, materials, normUVs) {
        super()

        this.geometry = geometry;
        this.materials = materials 
                        ? materials instanceof Array ? materials : [materials]
                        : [];

        this.flipSided = false;
        this.doubleSided = false;

        this.overdraw = false;

        if (normUVs) this.normalizeUVs();

        this.geometry.computeBoundingBox();
    }

    normalizeUVs() {
        
        this.geometry.uvs.forEach(uvArr => {
            uvArr.forEach(uv => {
                if (uv.u != 1.0) uv.u = uv.u - Math.floor(uv.u);
                if (uv.v != 1.0) uv.v = uv.v - Math.floor(uv.v);
            })
        });

    }

}