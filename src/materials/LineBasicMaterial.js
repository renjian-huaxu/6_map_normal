
import Color from "../core/Color";
import { NormalBlending } from "./Material";

export default class LineBasicMaterial {

    constructor(parameters) {
        
        this.color = new Color( 0xff0000 );
        this.opacity = 1;
        this.blending = NormalBlending;
        this.linewidth = 1;
        this.linecap = 'round';
        this.linejoin = 'round';

        if ( parameters ) {

            if ( parameters.color !== undefined ) this.color.setHex( parameters.color );
            if ( parameters.opacity !== undefined ) this.opacity  = parameters.opacity;
            if ( parameters.blending !== undefined ) this.blending = parameters.blending;
            if ( parameters.linewidth !== undefined ) this.linewidth = parameters.linewidth;
            if ( parameters.linecap !== undefined ) this.linecap = parameters.linecap;
            if ( parameters.linejoin !== undefined ) this.linejoin = parameters.linejoin;
    
        }
    }

    toString() {
        return 'THREE.LineBasicMaterial (<br/>' +
        'color: ' + this.color + '<br/>' +
        'opacity: ' + this.opacity + '<br/>' +
        'blending: ' + this.blending + '<br/>' +
        'linewidth: ' + this.linewidth +'<br/>' +
        'linecap: ' + this.linecap +'<br/>' +
        'linejoin: ' + this.linejoin +'<br/>' +
        ')';
    }

}