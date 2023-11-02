import Matrix4 from "../core/Matrix4";
import Vector3 from "../core/Vector3";

export default class Camera {

	constructor(fov, aspect, near, far) {

		this.position = new Vector3( 0, 0, 0 );
		this.target = { position: new Vector3( 0, 0, 0 ) };
		this.up = new Vector3( 0, 1, 0 );
		this.matrix = new Matrix4();
		this.projectionMatrix = Matrix4.makePerspective( fov, aspect, near, far );
	
		this.autoUpdateMatrix = true;
		
	}

	translateX( amount ) {

		var vector = this.target.position
			.clone()
			.subSelf( this.position )
			.normalize()
			.multiplyScalar( amount );

		vector.cross( vector.clone(), this.up );

		this.position.addSelf( vector );
		this.target.position.addSelf( vector );

	}

	translateZ( amount ) {

		var vector = this.target.position
			.clone()
			.subSelf( this.position )
			.normalize()
			.multiplyScalar( amount );

		this.position.subSelf( vector );
		this.target.position.subSelf( vector );

	}

	updateMatrix() {

		this.matrix.lookAt( this.position, this.target.position, this.up );

	}

	toString() {

		return 'MTHREE.Camera ( ' + this.position + ', ' + this.target.position + ' )';
		
	}
}
