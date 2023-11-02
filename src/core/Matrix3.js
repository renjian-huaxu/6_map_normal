

export default class Matrix3 {

    constructor() {

        this.m = [];

    }

    transpose() {
        
        var tmp;

		tmp = this.m[1]; this.m[1] = this.m[3]; this.m[3] = tmp;
		tmp = this.m[2]; this.m[2] = this.m[6]; this.m[6] = tmp;
		tmp = this.m[5]; this.m[5] = this.m[7]; this.m[7] = tmp;

		return this;
    }
}