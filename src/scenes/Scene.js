
export default class Scene {

    objects = [];
    lights = [];

    constructor() {

    }

    addObject(object) {
        this.objects.push(object);
    }

    removeObject(object) {
        for (var i = 0, l = this.objects.length; i < l; i++) {

            if (object == this.objects[i]) {

                this.objects.splice(i, 1);
                return;

            }
        }
    }

    add(object) {
        this.addObject(object);
    }

    addLight(light) {

        this.lights.push(light);

    };

    removeLight(light) {

        for (var i = 0, l = this.lights.length; i < l; i++) {

            if (light == this.lights[i]) {

                this.lights.splice(i, 1);
                return;

            }
        }
    };

    toString() {
        return 'MTHREE.Scene ( ' + this.objects + ' )';
    }
}