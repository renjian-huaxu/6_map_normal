import { NormalBlending } from "./Material";

export default class MeshDepthMaterial {

    constructor(parameters) {
        this.near = 1;
        this.far = 1000;
        this.opacity = 1;
        this.blending = NormalBlending;
    
        if ( parameters ) {
    
            if ( parameters.near !== undefined ) this.near = parameters.near;
            if ( parameters.far !== undefined ) this.far = parameters.far;
            if ( parameters.opacity !== undefined ) this.opacity  = parameters.opacity;
            if ( parameters.blending !== undefined ) this.blending = parameters.blending;
    
        }

        
        this.__2near = 2 * this.near;
        this.__farPlusNear = this.far + this.near;
        this.__farMinusNear = this.far - this.near;
    }

    toString() {
        return 'THREE.MeshDepthMaterial';
    }
}