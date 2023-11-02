
export default class UV {

    constructor(u, v) {

        this.u = u || 0;
        this.v = v || 0;

    }

    copy(uv) {

        this.u = uv.u;
		this.v = uv.v;

    }

    toString() {

        return 'MTHREE.UV (' + this.u + ', ' + this.v + ')';
        
    }
}