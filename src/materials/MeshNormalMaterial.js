import { FlatShading, NormalBlending } from "./Material";


export default class MeshNormalMaterial {

    constructor(parameters) {

        this.opacity = 1;
        this.shading = FlatShading;
        this.blending = NormalBlending;
    
    
        if ( parameters ) {
    
            if ( parameters.opacity !== undefined ) this.opacity  = parameters.opacity;
            if ( parameters.shading !== undefined ) this.shading  = parameters.shading;
            if ( parameters.blending !== undefined ) this.blending = parameters.blending;
    
        }

    }

    toString() {
        return 'THREE.MeshNormalMaterial';
    }
}