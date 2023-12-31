var SceneUtils = {
	
	addMesh: function ( scene, geometry, scale, x, y, z, rx, ry, rz, material ) {
		
		var mesh = new MThree.Mesh( geometry, material );
		mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
		mesh.position.x = x;
		mesh.position.y = y;
		mesh.position.z = z;
		mesh.rotation.x = rx;
		mesh.rotation.y = ry;
		mesh.rotation.z = rz;
		scene.addObject( mesh );

		return mesh;
		
	},
	
	addPanoramaCubeWebGL: function ( scene, size, textureCube ) {
		
		var material = new MThree.MeshCubeMaterial( { env_map: textureCube } ),
			mesh = new MThree.Mesh( new MThree.Cube( size, size, size, 1, 1, null, true ), material );
		
		scene.addObject( mesh );
		
		return mesh;
		
	},

	addPanoramaCube: function( scene, size, images ) {
	
		var materials = [];
		materials.push( new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[0] ) } ) );
		materials.push( new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[1] ) } ) );
		materials.push( new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[2] ) } ) );
		materials.push( new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[3] ) } ) );
		materials.push( new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[4] ) } ) );
		materials.push( new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[5] ) } ) );

		mesh = new MThree.Mesh( new Cube( size, size, size, 1, 1, materials, true ), new MThree.MeshFaceMaterial() );
		scene.addObject( mesh );
		
		return mesh;

	},

	addPanoramaCubePlanes: function ( scene, size, images ) {

		
		var hsize = size/2, plane = new Plane( size, size ), pi2 = Math.PI/2, pi = Math.PI;

		SceneUtils.addMesh( scene, plane, 1,      0,     0,  -hsize,  0,      0,  0, new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[5] ) } ) );
		SceneUtils.addMesh( scene, plane, 1, -hsize,     0,       0,  0,    pi2,  0, new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[0] ) } ) );
		SceneUtils.addMesh( scene, plane, 1,  hsize,     0,       0,  0,   -pi2,  0, new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[1] ) } ) );
		SceneUtils.addMesh( scene, plane, 1,     0,  hsize,       0,  pi2,    0, pi, new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[2] ) } ) );
		SceneUtils.addMesh( scene, plane, 1,     0, -hsize,       0, -pi2,    0, pi, new MThree.MeshBasicMaterial( { map: new MThree.Texture( images[3] ) } ) );
		
	}
	
}
