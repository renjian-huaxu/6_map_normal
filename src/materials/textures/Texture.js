import UVMapping from "../mappings/UVMapping";

const MultiplyOperation = 0;
const MixOperation = 1;

const RepeatWrapping = 0;
const ClampToEdgeWrapping = 1;
const MirroredRepeatWrapping = 2;

const NearestFilter = 3;
const NearestMipMapNearestFilter = 4;
const NearestMipMapLinearFilter = 5;
const LinearFilter = 6;
const LinearMipMapNearestFilter = 7;
const LinearMipMapLinearFilter = 8;

export default class Texture {

    constructor(image, mapping, wrap_s, wrap_t, mag_filter, min_filter) {
        this.image = image;

        this.mapping = mapping !== undefined ? mapping : new UVMapping();
    
        this.wrap_s = wrap_s !== undefined ? wrap_s : ClampToEdgeWrapping;
        this.wrap_t = wrap_t !== undefined ? wrap_t : ClampToEdgeWrapping;
    
        this.mag_filter = mag_filter !== undefined ? mag_filter : LinearFilter;
        this.min_filter = min_filter !== undefined ? min_filter : LinearMipMapLinearFilter;
    }

    toString() {
        
		return 'THREE.Texture (<br/>' +
        'image: ' + this.image + '<br/>' +
        'mapping: ' + this.mapping + '<br/>' +
        ')';
    }
}


export {
    MultiplyOperation,
    MixOperation,

    RepeatWrapping,
    ClampToEdgeWrapping,
    MirroredRepeatWrapping,

    NearestFilter,
    NearestMipMapNearestFilter,
    NearestMipMapLinearFilter,
    LinearFilter,
    LinearMipMapNearestFilter,
    LinearMipMapLinearFilter

}