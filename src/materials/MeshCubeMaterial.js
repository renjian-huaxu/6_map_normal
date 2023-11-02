import { NormalBlending } from "./Material";

const MeshCubeMaterialCounter = { value: 0 };

export default class MeshCubeMaterial {
    
    constructor(parameters) {

        this.id = MeshCubeMaterialCounter.value ++;

        this.env_map = null;
        this.blending = NormalBlending;
                
        if ( parameters ) {

            if ( parameters.env_map !== undefined ) this.env_map = parameters.env_map;

        }

    }

    toString() {
        
        return 'THREE.MeshCubeMaterial( ' +
			'id: ' + this.id + '<br/>' +
			'env_map: ' + this.env_map + ' )';
    }
}