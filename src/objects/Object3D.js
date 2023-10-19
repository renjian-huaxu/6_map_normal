
import Vector3 from '../core/Vector3'
import Matrix4 from '../core/Matrix4'

const Object3DCounter = { value: 0 };

export default class Object3D {

  constructor(material) {
    this.id = Object3DCounter.value++;

    this.position = new Vector3();
    this.rotation = new Vector3();
    this.scale = new Vector3(1, 1, 1);

    this.matrix = new Matrix4();
    this.translationMatrix = new Matrix4();
    this.rotationMatrix = new Matrix4();
    this.scaleMatrix = new Matrix4();

    this.screen = new Vector3();

    this.visible = true;
    this.autoUpdateMatrix = true;
  }

  updateMatrix() {
    this.matrixPosition = Matrix4.translationMatrix(this.position.x, this.position.y, this.position.z);

    this.rotationMatrix = Matrix4.rotationXMatrix(this.rotation.x);
    this.rotationMatrix.multiplySelf(Matrix4.rotationYMatrix(this.rotation.y));
    this.rotationMatrix.multiplySelf(Matrix4.rotationZMatrix(this.rotation.z));

    this.scaleMatrix = Matrix4.scaleMatrix(this.scale.x, this.scale.y, this.scale.z);

    this.matrix.copy(this.matrixPosition);
    this.matrix.multiplySelf(this.rotationMatrix);
    this.matrix.multiplySelf(this.scaleMatrix);
  }
}