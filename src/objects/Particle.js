import Object3D from "./Object3D";

export default class Particle extends Object3D {
    
    constructor(material) {
        super(material)

        this.material = material instanceof Array ? material : [ material ];
        this.autoUpdateMatrix = false;
    }
}