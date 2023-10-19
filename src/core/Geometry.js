import Face3 from "./Face3";
import Face4 from "./Face4";
import Vector3 from "./Vector3";

export default class Geometry {

	vertices = []
	faces = []
	uvs = []

	geometryChunks = {}

	hasTangents = false

	constructor() {

	}

	computeCentroids() {

		this.faces.forEach(face => {

			face.centroid.set(0, 0, 0);

			if (face instanceof Face3) {

				face.centroid.addSelf(this.vertices[face.a].position);
				face.centroid.addSelf(this.vertices[face.b].position);
				face.centroid.addSelf(this.vertices[face.c].position);
				face.centroid.divideScalar(3);

			} else if (face instanceof Face4) {

				face.centroid.addSelf(this.vertices[face.a].position);
				face.centroid.addSelf(this.vertices[face.b].position);
				face.centroid.addSelf(this.vertices[face.c].position);
				face.centroid.addSelf(this.vertices[face.d].position);
				face.centroid.divideScalar(4);

			}
		})
	}

	computeFaceNormals ( useVertexNormals ) {

		var cb = new Vector3(), ab = new Vector3();

		this.vertices.forEach(vertex => {
			vertex.normal.set( 0, 0, 0 );
		})

		this.faces.forEach(face => {
			if ( useVertexNormals && face.vertexNormals.length  ) {

				cb.set( 0, 0, 0 );

				face.normal.forEach((_, index) => {
					cb.addSelf( face.vertexNormals[index] );
				})

				cb.divideScalar( 3 );

				if ( ! cb.isZero() ) {

					cb.normalize();

				}

				face.normal.copy( cb );

			} else {

				const vA = this.vertices[ face.a ];
				const vB = this.vertices[ face.b ];
				const vC = this.vertices[ face.c ];

				cb.sub( vC.position, vB.position );
				ab.sub( vA.position, vB.position );
				cb.crossSelf( ab );

				if ( !cb.isZero() ) {

					cb.normalize();

				}

				face.normal.copy( cb );

			}
		})

	}

	computeVertexNormals () {

		var vertices = []

		this.vertices.forEach((_, index )=> {
			vertices[ index ] = new Vector3();
		})

		this.faces.forEach(face => {
			if ( face instanceof Face3 ) {

				vertices[ face.a ].addSelf( face.normal );
				vertices[ face.b ].addSelf( face.normal );
				vertices[ face.c ].addSelf( face.normal );

			} else if ( face instanceof Face4 ) {

				vertices[ face.a ].addSelf( face.normal );
				vertices[ face.b ].addSelf( face.normal );
				vertices[ face.c ].addSelf( face.normal );
				vertices[ face.d ].addSelf( face.normal );

			}
		})

		this.vertices.forEach((_, index) => {
			vertices[ index ].normalize();
		})

		this.faces.forEach(face => {
			if ( face instanceof Face3 ) {

				face.vertexNormals[ 0 ] = vertices[ face.a ].clone();
				face.vertexNormals[ 1 ] = vertices[ face.b ].clone();
				face.vertexNormals[ 2 ] = vertices[ face.c ].clone();

			} else if ( face instanceof Face4 ) {

				face.vertexNormals[ 0 ] = vertices[ face.a ].clone();
				face.vertexNormals[ 1 ] = vertices[ face.b ].clone();
				face.vertexNormals[ 2 ] = vertices[ face.c ].clone();
				face.vertexNormals[ 3 ] = vertices[ face.d ].clone();

			}
		})
	}

	computeTangents() {
		
		// based on http://www.terathon.com/code/tangent.html
		// tangents go to vertices
		
		var uv, 
			n,
			tan1 = [], tan2 = [],
			sdir = new Vector3(), tdir = new Vector3(),
			tmp = new Vector3(), tmp2 = new Vector3(), 
			n = new Vector3();

		this.vertices.forEach((_, index) => {
			tan1[ index ] = new Vector3();
			tan2[ index ] = new Vector3();
		})
		
		
		function handleTriangle( context, a, b, c ) {
			
			const vA = context.vertices[ a ].position;
			const vB = context.vertices[ b ].position;
			const vC = context.vertices[ c ].position;
			
			const uvA = uv[ 0 ];
			const uvB = uv[ 1 ];
			const uvC = uv[ 2 ];
			
			const x1 = vB.x - vA.x;
			const x2 = vC.x - vA.x;
			const y1 = vB.y - vA.y;
			const y2 = vC.y - vA.y;
			const z1 = vB.z - vA.z;
			const z2 = vC.z - vA.z;
			
			const s1 = uvB.u - uvA.u;
			const s2 = uvC.u - uvA.u;
			const t1 = uvB.v - uvA.v;
			const t2 = uvC.v - uvA.v;

			const r = 1.0 / ( s1 * t2 - s2 * t1 );
			sdir.set( ( t2 * x1 - t1 * x2 ) * r, 
					  ( t2 * y1 - t1 * y2 ) * r,
					  ( t2 * z1 - t1 * z2 ) * r );
			tdir.set( ( s1 * x2 - s2 * x1 ) * r, 
					  ( s1 * y2 - s2 * y1 ) * r,
					  ( s1 * z2 - s2 * z1 ) * r );
			
			tan1[ a ].addSelf( sdir );
			tan1[ b ].addSelf( sdir );
			tan1[ c ].addSelf( sdir );
			
			tan2[ a ].addSelf( tdir );
			tan2[ b ].addSelf( tdir );
			tan2[ c ].addSelf( tdir );
			
		}

		this.faces.forEach((face, index) => {
			uv = this.uvs[ index ];

			if ( face instanceof Face3 ) {
				
				handleTriangle( this, face.a, face.b, face.c );
				
				this.vertices[ face.a ].normal.copy( face.vertexNormals[ 0 ] );
				this.vertices[ face.b ].normal.copy( face.vertexNormals[ 1 ] );
				this.vertices[ face.c ].normal.copy( face.vertexNormals[ 2 ] );
				
				
			} else if ( face instanceof Face4 ) {
				
				handleTriangle( this, face.a, face.b, face.c );
				
				// this messes up everything
				// quads need to be handled differently
				//handleTriangle( this, face.a, face.c, face.d );

				this.vertices[ face.a ].normal.copy( face.vertexNormals[ 0 ] );
				this.vertices[ face.b ].normal.copy( face.vertexNormals[ 1 ] );
				this.vertices[ face.c ].normal.copy( face.vertexNormals[ 2 ] );
				this.vertices[ face.d ].normal.copy( face.vertexNormals[ 3 ] );
				
			}
		})

		this.vertices.forEach((vertex, index) => {
			n.copy( vertex.normal );
			const t = tan1[ index ];
			
			// Gram-Schmidt orthogonalize
			
			tmp.copy( t );
			tmp.subSelf( n.multiplyScalar( n.dot( t ) ) ).normalize();
			
			// Calculate handedness
			
			tmp2.cross( vertex.normal, t );
			const test = tmp2.dot( tan2[ index ] );
			const w = (test < 0.0) ? -1.0 : 1.0;
			
			vertex.tangent.set( tmp.x, tmp.y, tmp.z, w );
		})
		
		this.hasTangents = true;
		
	}

	computeBoundingBox() {
		if (this.vertices.length > 0) {

			this.bbox = {
				'x': [this.vertices[0].position.x, this.vertices[0].position.x],
				'y': [this.vertices[0].position.y, this.vertices[0].position.y],
				'z': [this.vertices[0].position.z, this.vertices[0].position.z]
			};

			this.vertices.forEach(vertex => {

				if (vertex.position.x < this.bbox.x[0]) {

					this.bbox.x[0] = vertex.position.x;

				} else if (vertex.position.x > this.bbox.x[1]) {

					this.bbox.x[1] = vertex.position.x;

				}

				if (vertex.position.y < this.bbox.y[0]) {

					this.bbox.y[0] = vertex.position.y;

				} else if (vertex.position.y > this.bbox.y[1]) {

					this.bbox.y[1] = vertex.position.y;

				}

				if (vertex.position.z < this.bbox.z[0]) {

					this.bbox.z[0] = vertex.position.z;

				} else if (vertex.position.z > this.bbox.z[1]) {

					this.bbox.z[1] = vertex.position.z;

				}

			});

		}
	}

	
    materialHash(material) {
		let hash_array = [];

		material.forEach(material => {
			if ( material == undefined ) {

				hash_array.push( "undefined" );

			} else {

				hash_array.push( material.toString() );

			}
		})

		return hash_array.join("_");
    }

    sortFacesByMaterial() {
		// TODO
		// Should optimize by grouping faces with ColorFill / ColorStroke materials
		// which could then use vertex color attributes instead of each being
		// in its separate VBO

		var f, fl, face, material, vertices, mhash, ghash, hash_map = {};

		this.faces.forEach((face, index) => {
			material = face.material;

			mhash = this.materialHash( material );

			if ( hash_map[ mhash ] == undefined ) {

				hash_map[ mhash ] = { 'hash': mhash, 'counter': 0 };

			}

			ghash = hash_map[ mhash ].hash + '_' + hash_map[ mhash ].counter;

			if ( this.geometryChunks[ ghash ] == undefined ) {

				this.geometryChunks[ ghash ] = { 'faces': [], 'material': material, 'vertices': 0 };

			}

			vertices = face instanceof Face3 ? 3 : 4;

			if ( this.geometryChunks[ ghash ].vertices + vertices > 65535 ) {

				hash_map[ mhash ].counter += 1;
				ghash = hash_map[ mhash ].hash + '_' + hash_map[ mhash ].counter;

				if ( this.geometryChunks[ ghash ] == undefined ) {

					this.geometryChunks[ ghash ] = { 'faces': [], 'material': material, 'vertices': 0 };

				}

			}

			this.geometryChunks[ ghash ].faces.push( index );
			this.geometryChunks[ ghash ].vertices += vertices;
		})
       
    }

	toString() {
		return 'MGeometry ( vertices: ' + this.vertices + ', faces: ' + this.faces + ' )';
	}
}