import Vector3 from "./Vector3";
import Vector4 from "./Vector4";

export default class Vertex {

    constructor(position, normal) {
        
        this.position = position || new Vector3();
        this.positionWorld = new Vector3();
        this.positionScreen = new Vector3();
    
        this.normal = normal || new Vector3();
        this.normalWorld = new Vector3();
        this.normalScreen = new Vector3();

        this.tangent = new Vector4();
    
        this.__visible = true;
    }

    toString() {

        return 'MTHREE.Vertex ( position: ' + this.position + ', normal: ' + this.normal + ' )';
        
    }
}