import Face3 from "../core/Face3";
import Face4 from "../core/Face4";
import Matrix4 from "../core/Matrix4";
import Mesh from "../objects/Mesh";
import AmbientLight from "../lights/AmbientLight";
import DirectionalLight from "../lights/DirectionalLight";
import PointLight from "../lights/PointLight";
import MeshBasicMaterial from "../materials/MeshBasicMaterial";
import MeshCubeMaterial from "../materials/MeshCubeMaterial";
import MeshDepthMaterial from "../materials/MeshDepthMaterial";
import MeshFaceMaterial from "../materials/MeshFaceMaterial";
import MeshLambertMaterial from "../materials/MeshLambertMaterial";
import MeshNormalMaterial from "../materials/MeshNormalMaterial";
import MeshPhongMaterial from "../materials/MeshPhongMaterial";
import MeshShaderMaterial from "../materials/MeshShaderMaterial";
import CubeRefractionMapping from "../materials/mappings/CubeRefractionMapping";
import {
	ClampToEdgeWrapping,
	LinearFilter,
	LinearMipMapLinearFilter,
	LinearMipMapNearestFilter,
	MirroredRepeatWrapping,
	MixOperation,
	NearestFilter,
	NearestMipMapLinearFilter,
	NearestMipMapNearestFilter,
	RepeatWrapping
} from "../materials/textures/Texture";
import {
	AdditiveBlending,
	NormalBlending,
	SmoothShading,
	SubtractiveBlending
} from "../materials/Material";

// ubershader material constants
const BASIC = 0, LAMBERT = 1, PHONG = 2, DEPTH = 3, NORMAL = 4, CUBE = 5

export default class WebGLRenderer {
	_canvas = document.createElement('canvas')

	domElement
	autoClear = true

	maxLightCount

	_modelViewMatrix = new Matrix4()

	_viewMatrixArray = new Float32Array(16)
	_modelViewMatrixArray = new Float32Array(16)
	_projectionMatrixArray = new Float32Array(16)
	_normalMatrixArray = new Float32Array(9)
	_objectMatrixArray = new Float32Array(16)

	_normalMatrix
	_gl
	_program
	_uberProgram
	_oldProgram

	constructor() {

		this.domElement = this._canvas
		this.maxLightCount = this.allocateLights(scene, 4);

		this.initGL()

		this._uberProgram = this.initUbershader(this.maxLightCount.directional, this.maxLightCount.point);
		this._oldProgram = this._uberProgram;
	}

	allocateLights(scene, maxLights) {
		if (scene) {

			var dirLights = 0, pointLights = 0, maxDirLights = 0, maxPointLights = 0;

			scene.lights.forEach(light => {
				if (light instanceof DirectionalLight) dirLights++;
				if (light instanceof PointLight) pointLights++;
			})

			if ((pointLights + dirLights) <= maxLights) {

				maxDirLights = dirLights;
				maxPointLights = pointLights;

			} else {

				maxDirLights = Math.ceil(maxLights * dirLights / (pointLights + dirLights));
				maxPointLights = maxLights - maxDirLights;

			}

			return { directional: maxDirLights, point: maxPointLights };

		}

		return { directional: 1, point: maxLights - 1 };
	}

	initUbershader(maxDirLights, maxPointLights) {
		let _gl = this._gl

		var vertex_shader = this.generateVertexShader(maxDirLights, maxPointLights),
			fragment_shader = this.generateFragmentShader(maxDirLights, maxPointLights),
			program;

		//log ( vertex_shader );
		//log ( fragment_shader );

		program = this.buildProgram(fragment_shader, vertex_shader);

		_gl.useProgram(program);

		// matrices
		// lights
		// material properties (Basic / Lambert / Blinn-Phong shader)
		// material properties (Depth)

		this.cacheUniformLocations(program, [
			'viewMatrix', 'modelViewMatrix', 'projectionMatrix', 'normalMatrix', 'objectMatrix', 'cameraPosition',
			'enableLighting', 'ambientLightColor',
			'material', 'mColor', 'mAmbient', 'mSpecular', 'mShininess', 'mOpacity',
			'enableMap', 'tMap',
			'enableCubeMap', 'tCube', 'mixEnvMap', 'mReflectivity',
			'mRefractionRatio', 'useRefract',
			'm2Near', 'mFarPlusNear', 'mFarMinusNear'
		]);

		if (maxDirLights) {

			this.cacheUniformLocations(program, ['directionalLightNumber', 'directionalLightColor', 'directionalLightDirection']);

		}

		if (maxPointLights) {

			this.cacheUniformLocations(program, ['pointLightNumber', 'pointLightColor', 'pointLightPosition']);

		}

		// texture (diffuse map)

		_gl.uniform1i(program.uniforms.enableMap, 0);
		_gl.uniform1i(program.uniforms.tMap, 0);

		// cube texture

		_gl.uniform1i(program.uniforms.enableCubeMap, 0);
		_gl.uniform1i(program.uniforms.tCube, 1); // it's important to use non-zero texture unit, otherwise it doesn't work
		_gl.uniform1i(program.uniforms.mixEnvMap, 0);

		// refraction

		_gl.uniform1i(program.uniforms.useRefract, 0);

		// attribute arrays

		this.cacheAttributeLocations(program, ["position", "normal", "uv"]);

		return program;

	}

	setSize(width, height) {

		this._canvas.width = width;
		this._canvas.height = height;
		this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);

	}

	clear() {
		let _gl = this._gl

		_gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
	}

	setupLights(program, lights) {
		let _gl = this._gl

		var r, g, b,
			ambientLights = [], pointLights = [], directionalLights = [],
			colors = [], positions = [];

		_gl.uniform1i(program.uniforms.enableLighting, lights.length);

		lights.forEach(light => {
			if (light instanceof AmbientLight) {

				ambientLights.push(light);

			} else if (light instanceof DirectionalLight) {

				directionalLights.push(light);

			} else if (light instanceof PointLight) {

				pointLights.push(light);

			}
		})

		// sum all ambient lights
		r = g = b = 0.0;

		ambientLights.forEach(light => {
			r += light.color.r;
			g += light.color.g;
			b += light.color.b;
		})

		_gl.uniform3f(program.uniforms.ambientLightColor, r, g, b);

		// pass directional lights as float arrays

		colors = []; positions = [];

		directionalLights.forEach(light => {
			colors.push(light.color.r * light.intensity);
			colors.push(light.color.g * light.intensity);
			colors.push(light.color.b * light.intensity);

			positions.push(light.position.x);
			positions.push(light.position.y);
			positions.push(light.position.z);
		});

		if (directionalLights.length) {

			_gl.uniform1i(program.uniforms.directionalLightNumber, directionalLights.length);
			_gl.uniform3fv(program.uniforms.directionalLightDirection, positions);
			_gl.uniform3fv(program.uniforms.directionalLightColor, colors);

		}

		// pass point lights as float arrays

		colors = []; positions = [];

		pointLights.forEach(light => {
			colors.push(light.color.r * light.intensity);
			colors.push(light.color.g * light.intensity);
			colors.push(light.color.b * light.intensity);

			positions.push(light.position.x);
			positions.push(light.position.y);
			positions.push(light.position.z);
		})

		if (pointLights.length) {

			_gl.uniform1i(program.uniforms.pointLightNumber, pointLights.length);
			_gl.uniform3fv(program.uniforms.pointLightPosition, positions);
			_gl.uniform3fv(program.uniforms.pointLightColor, colors);

		}
	}

	createBuffers(object, g) {
		let _gl = this._gl

		var 
			faceArray = [],
			lineArray = [],

			vertexArray = [],
			normalArray = [],
			tangentArray = [],
			uvArray = [],

			vertexIndex = 0,

			geometryChunk = object.geometry.geometryChunks[g],

			needsSmoothNormals = this.bufferNeedsSmoothNormals(geometryChunk, object);

		geometryChunk.faces.forEach(fi => {
			const face = object.geometry.faces[fi];
			const vertexNormals = face.vertexNormals;
			const faceNormal = face.normal;
			const uv = object.geometry.uvs[fi];

			if (face instanceof Face3) {

				const v1 = object.geometry.vertices[face.a].position;
				const v2 = object.geometry.vertices[face.b].position;
				const v3 = object.geometry.vertices[face.c].position;

				vertexArray.push(v1.x, v1.y, v1.z);
				vertexArray.push(v2.x, v2.y, v2.z);
				vertexArray.push(v3.x, v3.y, v3.z);

				if (object.geometry.hasTangents) {

					const t1 = object.geometry.vertices[face.a].tangent;
					const t2 = object.geometry.vertices[face.b].tangent;
					const t3 = object.geometry.vertices[face.c].tangent;

					tangentArray.push(t1.x, t1.y, t1.z, t1.w);
					tangentArray.push(t2.x, t2.y, t2.z, t2.w);
					tangentArray.push(t3.x, t3.y, t3.z, t3.w);

				}

				if (vertexNormals.length == 3 && needsSmoothNormals) {


					for (let i = 0; i < 3; i++) {

						normalArray.push(vertexNormals[i].x, vertexNormals[i].y, vertexNormals[i].z);

					}

				} else {

					for (let i = 0; i < 3; i++) {

						normalArray.push(faceNormal.x, faceNormal.y, faceNormal.z);

					}

				}

				if (uv) {

					for (let i = 0; i < 3; i++) {

						uvArray.push(uv[i].u, uv[i].v);

					}

				}

				faceArray.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);

				// TODO: don't add lines that already exist (faces sharing edge)

				lineArray.push(vertexIndex, vertexIndex + 1);
				lineArray.push(vertexIndex, vertexIndex + 2);
				lineArray.push(vertexIndex + 1, vertexIndex + 2);

				vertexIndex += 3;

			} else if (face instanceof Face4) {

				const v1 = object.geometry.vertices[face.a].position;
				const v2 = object.geometry.vertices[face.b].position;
				const v3 = object.geometry.vertices[face.c].position;
				const v4 = object.geometry.vertices[face.d].position;

				vertexArray.push(v1.x, v1.y, v1.z);
				vertexArray.push(v2.x, v2.y, v2.z);
				vertexArray.push(v3.x, v3.y, v3.z);
				vertexArray.push(v4.x, v4.y, v4.z);

				if (object.geometry.hasTangents) {

					const t1 = object.geometry.vertices[face.a].tangent;
					const t2 = object.geometry.vertices[face.b].tangent;
					const t3 = object.geometry.vertices[face.c].tangent;
					const t4 = object.geometry.vertices[face.d].tangent;

					tangentArray.push(t1.x, t1.y, t1.z, t1.w);
					tangentArray.push(t2.x, t2.y, t2.z, t2.w);
					tangentArray.push(t3.x, t3.y, t3.z, t3.w);
					tangentArray.push(t4.x, t4.y, t4.z, t4.w);

				}

				if (vertexNormals.length == 4 && needsSmoothNormals) {

					for (let i = 0; i < 4; i++) {

						normalArray.push(vertexNormals[i].x, vertexNormals[i].y, vertexNormals[i].z);

					}

				} else {

					for (let i = 0; i < 4; i++) {

						normalArray.push(faceNormal.x, faceNormal.y, faceNormal.z);

					}

				}

				if (uv) {

					for (let i = 0; i < 4; i++) {

						uvArray.push(uv[i].u, uv[i].v);

					}

				}

				faceArray.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
				faceArray.push(vertexIndex, vertexIndex + 2, vertexIndex + 3);

				// TODO: don't add lines that already exist (faces sharing edge)

				lineArray.push(vertexIndex, vertexIndex + 1);
				lineArray.push(vertexIndex, vertexIndex + 2);
				lineArray.push(vertexIndex, vertexIndex + 3);
				lineArray.push(vertexIndex + 1, vertexIndex + 2);
				lineArray.push(vertexIndex + 2, vertexIndex + 3);

				vertexIndex += 4;

			}
		})

		if (!vertexArray.length) {

			return;

		}

		geometryChunk.__webGLVertexBuffer = _gl.createBuffer();
		_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLVertexBuffer);
		_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(vertexArray), _gl.STATIC_DRAW);

		geometryChunk.__webGLNormalBuffer = _gl.createBuffer();
		_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLNormalBuffer);
		_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(normalArray), _gl.STATIC_DRAW);

		if (object.geometry.hasTangents) {

			geometryChunk.__webGLTangentBuffer = _gl.createBuffer();
			_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLTangentBuffer);
			_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(tangentArray), _gl.STATIC_DRAW);

		}

		if (uvArray.length > 0) {

			geometryChunk.__webGLUVBuffer = _gl.createBuffer();
			_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLUVBuffer);
			_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(uvArray), _gl.STATIC_DRAW);

		}

		geometryChunk.__webGLFaceBuffer = _gl.createBuffer();
		_gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, geometryChunk.__webGLFaceBuffer);
		_gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faceArray), _gl.STATIC_DRAW);

		geometryChunk.__webGLLineBuffer = _gl.createBuffer();
		_gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, geometryChunk.__webGLLineBuffer);
		_gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineArray), _gl.STATIC_DRAW);

		geometryChunk.__webGLFaceCount = faceArray.length;
		geometryChunk.__webGLLineCount = lineArray.length;
	}

	bufferNeedsSmoothNormals(geometryChunk, object) {

		var needsSmoothNormals = false;

		object.materials.forEach(meshMaterial => {
			if (meshMaterial instanceof MeshFaceMaterial) {

				geometryChunk.material.forEach(material => {
					if (this.materialNeedsSmoothNormals(material)) {
						needsSmoothNormals = true;
					}
				})

			} else {

				if (this.materialNeedsSmoothNormals(meshMaterial)) {
					needsSmoothNormals = true;
				}

			}
		})

		return needsSmoothNormals;

	}

	materialNeedsSmoothNormals(material) {

		return material && material.shading != undefined && material.shading == SmoothShading;

	}


	renderBuffer(camera, lights, material, geometryChunk) {
		let _gl = this._gl

		var mColor, mOpacity, mReflectivity,
			mWireframe, mLineWidth, mBlending,
			mAmbient, mSpecular, mShininess,
			mMap, envMap, mixEnvMap,
			mRefractionRatio, useRefract,
			program, u, identifiers, attributes;


		if (material instanceof MeshShaderMaterial) {

			if (!material.program) {

				material.program = this.buildProgram(material.fragment_shader, material.vertex_shader);

				identifiers = ['viewMatrix', 'modelViewMatrix', 'projectionMatrix', 'normalMatrix', 'objectMatrix', 'cameraPosition'];
				for (u in material.uniforms) {

					identifiers.push(u);

				}
				this.cacheUniformLocations(material.program, identifiers);
				this.cacheAttributeLocations(material.program, ["position", "normal", "uv", "tangent"]);

			}

			program = material.program;

		} else {
			program = this._uberProgram;
		}

		if (program != this._oldProgram) {
			_gl.useProgram(program);
			this._oldProgram = program;
		}

		if (program == this._uberProgram) {
			this.setupLights(program, lights);
		}

		this.loadCamera(program, camera);
		this.loadMatrices(program);


		if (material instanceof MeshShaderMaterial) {

			mWireframe = material.wireframe;
			mLineWidth = material.wireframe_linewidth;

			mBlending = material.blending;

			this.setUniforms(program, material.uniforms);
		}


		if (material instanceof MeshPhongMaterial ||
			material instanceof MeshLambertMaterial ||
			material instanceof MeshBasicMaterial) {

			mColor = material.color;
			mOpacity = material.opacity;

			mWireframe = material.wireframe;
			mLineWidth = material.wireframe_linewidth;

			mBlending = material.blending;

			mMap = material.map;
			envMap = material.env_map;

			mixEnvMap = material.combine == MixOperation;
			mReflectivity = material.reflectivity;

			useRefract = material.env_map && material.env_map.mapping instanceof CubeRefractionMapping;
			mRefractionRatio = material.refraction_ratio;

			_gl.uniform4f(program.uniforms.mColor, mColor.r * mOpacity, mColor.g * mOpacity, mColor.b * mOpacity, mOpacity);

			_gl.uniform1i(program.uniforms.mixEnvMap, mixEnvMap);
			_gl.uniform1f(program.uniforms.mReflectivity, mReflectivity);

			_gl.uniform1i(program.uniforms.useRefract, useRefract);
			_gl.uniform1f(program.uniforms.mRefractionRatio, mRefractionRatio);

		}

		if (material instanceof MeshNormalMaterial) {

			mOpacity = material.opacity;
			mBlending = material.blending;

			_gl.uniform1f(program.uniforms.mOpacity, mOpacity);

			_gl.uniform1i(program.uniforms.material, NORMAL);

		} else if (material instanceof MeshDepthMaterial) {

			mOpacity = material.opacity;

			mWireframe = material.wireframe;
			mLineWidth = material.wireframe_linewidth;

			_gl.uniform1f(program.uniforms.mOpacity, mOpacity);

			_gl.uniform1f(program.uniforms.m2Near, material.__2near);
			_gl.uniform1f(program.uniforms.mFarPlusNear, material.__farPlusNear);
			_gl.uniform1f(program.uniforms.mFarMinusNear, material.__farMinusNear);

			_gl.uniform1i(program.uniforms.material, DEPTH);

		} else if (material instanceof MeshPhongMaterial) {

			mAmbient = material.ambient;
			mSpecular = material.specular;
			mShininess = material.shininess;

			_gl.uniform4f(program.uniforms.mAmbient, mAmbient.r, mAmbient.g, mAmbient.b, mOpacity);
			_gl.uniform4f(program.uniforms.mSpecular, mSpecular.r, mSpecular.g, mSpecular.b, mOpacity);
			_gl.uniform1f(program.uniforms.mShininess, mShininess);

			_gl.uniform1i(program.uniforms.material, PHONG);

		} else if (material instanceof MeshLambertMaterial) {

			_gl.uniform1i(program.uniforms.material, LAMBERT);

		} else if (material instanceof MeshBasicMaterial) {

			_gl.uniform1i(program.uniforms.material, BASIC);

		} else if (material instanceof MeshCubeMaterial) {

			_gl.uniform1i(program.uniforms.material, CUBE);

			envMap = material.env_map;
		}


		if (mMap) {

			this.setTexture(mMap, 0);

			_gl.uniform1i(program.uniforms.tMap, 0);
			_gl.uniform1i(program.uniforms.enableMap, 1);

		} else {
			_gl.uniform1i(program.uniforms.enableMap, 0);
		}

		if (envMap) {

			this.setCubeTexture(envMap, 1);

			_gl.uniform1i(program.uniforms.tCube, 1);
			_gl.uniform1i(program.uniforms.enableCubeMap, 1);

		} else {

			_gl.uniform1i(program.uniforms.enableCubeMap, 0);

		}


		attributes = program.attributes;

		// vertices

		_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLVertexBuffer);
		_gl.vertexAttribPointer(attributes.position, 3, _gl.FLOAT, false, 0, 0);

		// normals

		if (attributes.normal >= 0) {

			_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLNormalBuffer);
			_gl.vertexAttribPointer(attributes.normal, 3, _gl.FLOAT, false, 0, 0);

		}

		// tangents

		if (attributes.tangent >= 0) {

			_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLTangentBuffer);
			_gl.vertexAttribPointer(attributes.tangent, 4, _gl.FLOAT, false, 0, 0);

		}

		// uvs

		if (attributes.uv >= 0) {

			if (geometryChunk.__webGLUVBuffer) {

				_gl.bindBuffer(_gl.ARRAY_BUFFER, geometryChunk.__webGLUVBuffer);

				_gl.enableVertexAttribArray(attributes.uv);
				_gl.vertexAttribPointer(attributes.uv, 2, _gl.FLOAT, false, 0, 0);

			} else {

				_gl.disableVertexAttribArray(attributes.uv);

			}

		}

		// render triangles

		if (!mWireframe) {

			_gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, geometryChunk.__webGLFaceBuffer);
			_gl.drawElements(_gl.TRIANGLES, geometryChunk.__webGLFaceCount, _gl.UNSIGNED_SHORT, 0);

			// render lines

		} else {

			_gl.lineWidth(mLineWidth);
			_gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, geometryChunk.__webGLLineBuffer);
			_gl.drawElements(_gl.LINES, geometryChunk.__webGLLineCount, _gl.UNSIGNED_SHORT, 0);

		}
	}

	setUniforms(program, uniforms) {
		const _gl = this._gl

		var u, value, type, location, texture;

		for (u in uniforms) {

			type = uniforms[u].type;
			value = uniforms[u].value;
			location = program.uniforms[u];

			if (type == "i") {

				_gl.uniform1i(location, value);

			} else if (type == "f") {

				_gl.uniform1f(location, value);

			} else if (type == "v3") {

				_gl.uniform3f(location, value.x, value.y, value.z);

			} else if (type == "c") {

				_gl.uniform3f(location, value.r, value.g, value.b);

			} else if (type == "t") {

				_gl.uniform1i(location, value);

				texture = uniforms[u].texture;

				if (!texture) continue;

				if (texture.image instanceof Array && texture.image.length == 6) {

					this.setCubeTexture(texture, value);

				} else {

					this.setTexture(texture, value);

				}

			}

		}

	}

	setCubeTexture(texture, slot) {
		const _gl = this._gl

		if (texture.image.length == 6) {

			if (!texture.image.__webGLTextureCube &&
				!texture.image.__cubeMapInitialized && texture.image.loadCount == 6) {

				texture.image.__webGLTextureCube = _gl.createTexture();

				_gl.bindTexture(_gl.TEXTURE_CUBE_MAP, texture.image.__webGLTextureCube);

				_gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
				_gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

				_gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
				_gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_LINEAR);

				for (var i = 0; i < 6; ++i) {

					_gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, texture.image[i]);

				}

				_gl.generateMipmap(_gl.TEXTURE_CUBE_MAP);

				_gl.bindTexture(_gl.TEXTURE_CUBE_MAP, null);

				texture.image.__cubeMapInitialized = true;

			}

			_gl.activeTexture(_gl.TEXTURE0 + slot);
			_gl.bindTexture(_gl.TEXTURE_CUBE_MAP, texture.image.__webGLTextureCube);

		}

	};

	setTexture(texture, slot) {
		const _gl = this._gl

		if (!texture.__webGLTexture && texture.image.loaded) {

			texture.__webGLTexture = _gl.createTexture();
			_gl.bindTexture(_gl.TEXTURE_2D, texture.__webGLTexture);
			_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, texture.image);

			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, this.paramThreeToGL(texture.wrap_s));
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, this.paramThreeToGL(texture.wrap_t));

			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, this.paramThreeToGL(texture.mag_filter));
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, this.paramThreeToGL(texture.min_filter));
			_gl.generateMipmap(_gl.TEXTURE_2D);
			_gl.bindTexture(_gl.TEXTURE_2D, null);

		}

		_gl.activeTexture(_gl.TEXTURE0 + slot);
		_gl.bindTexture(_gl.TEXTURE_2D, texture.__webGLTexture);

	}

	paramThreeToGL(p) {
		const _gl = this._gl

		switch (p) {

			case RepeatWrapping: return _gl.REPEAT; break;
			case ClampToEdgeWrapping: return _gl.CLAMP_TO_EDGE; break;
			case MirroredRepeatWrapping: return _gl.MIRRORED_REPEAT; break;

			case NearestFilter: return _gl.NEAREST; break;
			case NearestMipMapNearestFilter: return _gl.NEAREST_MIPMAP_NEAREST; break;
			case NearestMipMapLinearFilter: return _gl.NEAREST_MIPMAP_LINEAR; break;

			case LinearFilter: return _gl.LINEAR; break;
			case LinearMipMapNearestFilter: return _gl.LINEAR_MIPMAP_NEAREST; break;
			case LinearMipMapLinearFilter: return _gl.LINEAR_MIPMAP_LINEAR; break;

		}

		return 0;

	}

	loadMatrices(program) {
		this._gl.uniformMatrix4fv(program.uniforms.viewMatrix, false, this._viewMatrixArray);
		this._gl.uniformMatrix4fv(program.uniforms.modelViewMatrix, false, this._modelViewMatrixArray);
		this._gl.uniformMatrix4fv(program.uniforms.projectionMatrix, false, this._projectionMatrixArray);
		this._gl.uniformMatrix3fv(program.uniforms.normalMatrix, false, this._normalMatrixArray);
		this._gl.uniformMatrix4fv(program.uniforms.objectMatrix, false, this._objectMatrixArray);

	}

	loadCamera(program, camera) {
		this._gl.uniform3f(program.uniforms.cameraPosition, camera.position.x, camera.position.y, camera.position.z);
	}

	renderPass(camera, lights, object, geometryChunk, blending, transparent) {

		object.materials.forEach(meshMaterial => {

			if (meshMaterial instanceof MeshFaceMaterial) {

				geometryChunk.material.forEach(material => {
					if (material && material.blending == blending && (material.opacity < 1.0 == transparent)) {

						this.setBlending(material.blending);
						this.renderBuffer(camera, lights, material, geometryChunk);

					}
				})

			} else {

				const material = meshMaterial;
				if (material && material.blending == blending && (material.opacity < 1.0 == transparent)) {

					this.setBlending(material.blending);
					this.renderBuffer(camera, lights, material, geometryChunk);

				}

			}
		})

	}

	setupMatrices(object, camera) {

		object.autoUpdateMatrix && object.updateMatrix();

		this._modelViewMatrix.multiply(camera.matrix, object.matrix);
		this._modelViewMatrixArray.set(this._modelViewMatrix.flatten());

		this._normalMatrix = Matrix4.makeInvert3x3(this._modelViewMatrix).transpose();
		this._normalMatrixArray.set(this._normalMatrix.m);

		this._objectMatrixArray.set(object.matrix.flatten());
	}

	setBlending(blending) {
		let _gl = this._gl

		switch (blending) {

			case AdditiveBlending:

				_gl.blendEquation(_gl.FUNC_ADD);
				_gl.blendFunc(_gl.ONE, _gl.ONE);

				break;

			case SubtractiveBlending:

				//_gl.blendEquation( _gl.FUNC_SUBTRACT );
				_gl.blendFunc(_gl.DST_COLOR, _gl.ZERO);

				break;

			default:

				_gl.blendEquation(_gl.FUNC_ADD);
				_gl.blendFunc(_gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);

				break;
		}
	}

	setFaceCulling(cullFace, frontFace) {
		let _gl = this._gl

		if (cullFace) {

			if (!frontFace || frontFace == "ccw") {

				_gl.frontFace(_gl.CCW);

			} else {

				_gl.frontFace(_gl.CW);
			}

			if (cullFace == "back") {

				_gl.cullFace(_gl.BACK);

			} else if (cullFace == "front") {

				_gl.cullFace(_gl.FRONT);

			} else {

				_gl.cullFace(_gl.FRONT_AND_BACK);
			}

			_gl.enable(_gl.CULL_FACE);

		} else {

			_gl.disable(_gl.CULL_FACE);
		}
	}

	render(scene, camera) {

		this.initWebGLObjects(scene);

		if (this.autoClear) {

			this.clear();

		}

		camera.autoUpdateMatrix && camera.updateMatrix();
		this._viewMatrixArray.set(camera.matrix.flatten());
		this._projectionMatrixArray.set(camera.projectionMatrix.flatten());

		// opaque pass

		let object, buffer, lights = scene.lights

		scene.__webGLObjects.map(webGLObject => {
			object = webGLObject.object;
			buffer = webGLObject.buffer;

			if (object.visible) {

				this.setupMatrices(object, camera);
				this.renderPass(camera, lights, object, buffer, NormalBlending, false);

			}
		})

		// transparent pass

		scene.__webGLObjects.map(webGLObject => {
			object = webGLObject.object;
			buffer = webGLObject.buffer;

			if (object.visible) {

				this.setupMatrices(object, camera);

				// opaque blended materials

				this.renderPass(camera, lights, object, buffer, AdditiveBlending, false);
				this.renderPass(camera, lights, object, buffer, SubtractiveBlending, false);

				// transparent blended materials-

				this.renderPass(camera, lights, object, buffer, AdditiveBlending, true);
				this.renderPass(camera, lights, object, buffer, SubtractiveBlending, true);

				// transparent normal materials

				this.renderPass(camera, lights, object, buffer, NormalBlending, true);

			}
		})
	}

	initWebGLObjects(scene) {
		if (!scene.__webGLObjects) {

			scene.__webGLObjects = [];
			scene.__webGLObjectsMap = {};

		}

		scene.objects.forEach(object => {
			if (scene.__webGLObjectsMap[object.id] == undefined) {

				scene.__webGLObjectsMap[object.id] = {};

			}

			const objmap = scene.__webGLObjectsMap[object.id];

			if (object instanceof Mesh) {

				// create separate VBOs per geometry chunk

				for (let g in object.geometry.geometryChunks) {

					const geometryChunk = object.geometry.geometryChunks[g];

					// initialise VBO on the first access

					if (!geometryChunk.__webGLVertexBuffer) {

						this.createBuffers(object, g);

					}

					// create separate wrapper per each use of VBO

					if (objmap[g] == undefined) {

						const globject = { buffer: geometryChunk, object: object };
						scene.__webGLObjects.push(globject);

						objmap[g] = 1;

					}

				}

			}/* else if ( object instanceof Line ) {

			} else if ( object instanceof Particle ) {

			}*/
		})

	}

	initGL() {
		let _gl
		
		try {

			_gl = this._canvas.getContext('experimental-webgl', { antialias: true });

		} catch (e) { }

		if (!_gl) {

			alert("WebGL not supported");
			throw "cannot create webgl context";

		}

		// _gl.clearColor(0, 0, 0, 1);
		// _gl.clearDepth(1);

		_gl.enable(_gl.DEPTH_TEST);
		_gl.depthFunc(_gl.LEQUAL);

		_gl.frontFace(_gl.CCW);
		_gl.cullFace(_gl.BACK);
		_gl.enable(_gl.CULL_FACE);

		_gl.enable(_gl.BLEND);
		_gl.blendFunc(_gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);
		_gl.clearColor(0, 0, 0, 0);

		this._gl = _gl
	}

	maxVertexTextures() {

		return this._gl.getParameter(this._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);

	}

	supportsVertexTextures() {

		return this.maxVertexTextures() > 0;

	}

	buildProgram(fragment_shader, vertex_shader) {
		var _gl = this._gl

		var program = _gl.createProgram(),
			prefix_fragment = [
				"#ifdef GL_ES",
				"precision highp float;",
				"#endif",
				"uniform mat4 viewMatrix;",
				""
			].join("\n"),

			prefix_vertex = [
				this.maxVertexTextures() > 0 ? "#define VERTEX_TEXTURES" : "",

				"uniform mat4 objectMatrix;",
				"uniform mat4 modelViewMatrix;",
				"uniform mat4 projectionMatrix;",
				"uniform mat4 viewMatrix;",
				"uniform mat3 normalMatrix;",
				"uniform vec3 cameraPosition;",
				"attribute vec3 position;",
				"attribute vec3 normal;",
				"attribute vec2 uv;",
				""
			].join("\n");

		_gl.attachShader(program, this.getShader("fragment", prefix_fragment + fragment_shader));
		_gl.attachShader(program, this.getShader("vertex", prefix_vertex + vertex_shader));

		_gl.linkProgram(program);

		if (!_gl.getProgramParameter(program, _gl.LINK_STATUS)) {

			alert("Could not initialise shaders\n" +
				"VALIDATE_STATUS: " + _gl.getProgramParameter(program, _gl.VALIDATE_STATUS) + ", gl error [" + _gl.getError() + "]");

		}

		program.uniforms = {};
		program.attributes = {};

		return program;
	}

	getShader(type, string) {
		var _gl = this._gl

		var shader;

		if (type == "fragment") {

			shader = _gl.createShader(_gl.FRAGMENT_SHADER);

		} else if (type == "vertex") {

			shader = _gl.createShader(_gl.VERTEX_SHADER);

		}

		_gl.shaderSource(shader, string);
		_gl.compileShader(shader);

		if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {

			alert(_gl.getShaderInfoLog(shader));
			return null;

		}

		return shader;

	};

	generateFragmentShader(maxDirLights, maxPointLights) {

		var chunks = [

			maxDirLights ? "#define MAX_DIR_LIGHTS " + maxDirLights : "",
			maxPointLights ? "#define MAX_POINT_LIGHTS " + maxPointLights : "",

			"uniform int material;", // 0 - Basic, 1 - Lambert, 2 - Phong, 3 - Depth, 4 - Normal, 5 - Cube

			"uniform bool enableMap;",
			"uniform bool enableCubeMap;",
			"uniform bool mixEnvMap;",

			"uniform samplerCube tCube;",
			"uniform float mReflectivity;",

			"uniform sampler2D tMap;",
			"uniform vec4 mColor;",
			"uniform float mOpacity;",

			"uniform vec4 mAmbient;",
			"uniform vec4 mSpecular;",
			"uniform float mShininess;",

			"uniform float m2Near;",
			"uniform float mFarPlusNear;",
			"uniform float mFarMinusNear;",

			"uniform int pointLightNumber;",
			"uniform int directionalLightNumber;",

			maxDirLights ? "uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];" : "",

			"varying vec3 vNormal;",
			"varying vec2 vUv;",

			"varying vec3 vLightWeighting;",

			maxPointLights ? "varying vec3 vPointLightVector[ MAX_POINT_LIGHTS ];" : "",

			"varying vec3 vViewPosition;",

			"varying vec3 vReflect;",

			"uniform vec3 cameraPosition;",

			"void main() {",

			"	vec4 mapColor = vec4( 1.0, 1.0, 1.0, 1.0 );",
			"	vec4 cubeColor = vec4( 1.0, 1.0, 1.0, 1.0 );",

			// diffuse map

			"	if ( enableMap ) {",

			"		mapColor = texture2D( tMap, vUv );",

			"	}",

			// cube map

			"	if ( enableCubeMap ) {",

			"		cubeColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );",
			// "cubeColor.r = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) ).r;",
			// "cubeColor.g = textureCube( tCube, vec3( -vReflect.x + 0.005, vReflect.yz ) ).g;",
			// "cubeColor.b = textureCube( tCube, vec3( -vReflect.x + 0.01, vReflect.yz ) ).b;",

			"	}",

				// Cube

				"if ( material == 5 ) { ",

				"	vec3 wPos = cameraPosition - vViewPosition;",
				"	gl_FragColor = textureCube( tCube, vec3( -wPos.x, wPos.yz ) );",

				// Normals

				"} else if ( material == 4 ) { ",

				"	gl_FragColor = vec4( 0.5 * normalize( vNormal ) + 0.5, mOpacity );",

				// Depth

				"} else if ( material == 3 ) { ",

				// this breaks shader validation in Chrome 9.0.576.0 dev
				// and also latest continuous build Chromium 9.0.583.0 (66089)
				// (curiously it works in Chrome 9.0.576.0 canary build and Firefox 4b7)
				//"float w = 1.0 - ( m2Near / ( mFarPlusNear - gl_FragCoord.z * mFarMinusNear ) );",
				"	float w = 0.5;",

				"	gl_FragColor = vec4( w, w, w, mOpacity );",

				// Blinn-Phong
				// based on o3d example

				"} else if ( material == 2 ) { ",

				"	vec3 normal = normalize( vNormal );",
				"	vec3 viewPosition = normalize( vViewPosition );",

			// point lights

			maxPointLights ? "vec4 pointDiffuse  = vec4( 0.0, 0.0, 0.0, 0.0 );" : "",
			maxPointLights ? "vec4 pointSpecular = vec4( 0.0, 0.0, 0.0, 0.0 );" : "",

			maxPointLights ? "for( int i = 0; i < MAX_POINT_LIGHTS; i++ ) {" : "",

			maxPointLights ? "vec3 pointVector = normalize( vPointLightVector[ i ] );" : "",
			maxPointLights ? "vec3 pointHalfVector = normalize( vPointLightVector[ i ] + vViewPosition );" : "",

			maxPointLights ? "float pointDotNormalHalf = dot( normal, pointHalfVector );" : "",
			maxPointLights ? "float pointDiffuseWeight = max( dot( normal, pointVector ), 0.0 );" : "",

			// Ternary conditional is from the original o3d shader. Here it produces abrupt dark cutoff artefacts.
			// Using just pow works ok in Chrome, but makes different artefact in Firefox 4.
			// Zeroing on negative pointDotNormalHalf seems to work in both.

			//"float specularCompPoint = dot( normal, pointVector ) < 0.0 || pointDotNormalHalf < 0.0 ? 0.0 : pow( pointDotNormalHalf, mShininess );",
			//"float specularCompPoint = pow( pointDotNormalHalf, mShininess );",
			//"float pointSpecularWeight = pointDotNormalHalf < 0.0 ? 0.0 : pow( pointDotNormalHalf, mShininess );",

			// Ternary conditional inside for loop breaks Chrome shader linking.
			// Must do it with if.

			maxPointLights ? "float pointSpecularWeight = 0.0;" : "",
			maxPointLights ? "if ( pointDotNormalHalf >= 0.0 )" : "",
			maxPointLights ? "pointSpecularWeight = pow( pointDotNormalHalf, mShininess );" : "",

			maxPointLights ? "pointDiffuse  += mColor * pointDiffuseWeight;" : "",
			maxPointLights ? "pointSpecular += mSpecular * pointSpecularWeight;" : "",

			maxPointLights ? "}" : "",

			// directional lights

			maxDirLights ? "vec4 dirDiffuse  = vec4( 0.0, 0.0, 0.0, 0.0 );" : "",
			maxDirLights ? "vec4 dirSpecular = vec4( 0.0, 0.0, 0.0, 0.0 );" : "",

			maxDirLights ? "for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {" : "",

			maxDirLights ? "vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );" : "",

			maxDirLights ? "vec3 dirVector = normalize( lDirection.xyz );" : "",
			maxDirLights ? "vec3 dirHalfVector = normalize( lDirection.xyz + vViewPosition );" : "",

			maxDirLights ? "float dirDotNormalHalf = dot( normal, dirHalfVector );" : "",

			maxDirLights ? "float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );" : "",

			maxDirLights ? "float dirSpecularWeight = 0.0;" : "",
			maxDirLights ? "if ( dirDotNormalHalf >= 0.0 )" : "",
			maxDirLights ? "dirSpecularWeight = pow( dirDotNormalHalf, mShininess );" : "",

			maxDirLights ? "dirDiffuse  += mColor * dirDiffuseWeight;" : "",
			maxDirLights ? "dirSpecular += mSpecular * dirSpecularWeight;" : "",

			maxDirLights ? "}" : "",

				// all lights contribution summation

				"vec4 totalLight = mAmbient;",
				maxDirLights ? "totalLight += dirDiffuse + dirSpecular;" : "",
				maxPointLights ? "totalLight += pointDiffuse + pointSpecular;" : "",

				// looks nicer with weighting

				"if ( mixEnvMap ) {",

				"	gl_FragColor = vec4( mix( mapColor.rgb * totalLight.xyz * vLightWeighting, cubeColor.rgb, mReflectivity ), mapColor.a );",

				"} else {",

				"	gl_FragColor = vec4( mapColor.rgb * cubeColor.rgb * totalLight.xyz * vLightWeighting, mapColor.a );",

				"}",

				// Lambert: diffuse lighting

				"} else if ( material == 1 ) {",

				"	if ( mixEnvMap ) {",

				"		gl_FragColor = vec4( mix( mColor.rgb * mapColor.rgb * vLightWeighting, cubeColor.rgb, mReflectivity ), mColor.a * mapColor.a );",

				"	} else {",

				"		gl_FragColor = vec4( mColor.rgb * mapColor.rgb * cubeColor.rgb * vLightWeighting, mColor.a * mapColor.a );",

				"	}",

				// Basic: unlit color / texture

				"} else {",

				"	if ( mixEnvMap ) {",

				"		gl_FragColor = mix( mColor * mapColor, cubeColor, mReflectivity );",

				"	} else {",

				"		gl_FragColor = mColor * mapColor * cubeColor;",

				"	}",

				"}",

			"}"];

		return chunks.join("\n");

	}

	generateVertexShader(maxDirLights, maxPointLights) {
		var chunks = [

			maxDirLights ? "#define MAX_DIR_LIGHTS " + maxDirLights : "",
			maxPointLights ? "#define MAX_POINT_LIGHTS " + maxPointLights : "",

			"uniform bool enableLighting;",
			"uniform bool useRefract;",

			"uniform int pointLightNumber;",
			"uniform int directionalLightNumber;",

			"uniform vec3 ambientLightColor;",

			maxDirLights ? "uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];" : "",
			maxDirLights ? "uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];" : "",

			maxPointLights ? "uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];" : "",
			maxPointLights ? "uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];" : "",

			"varying vec3 vNormal;",
			"varying vec2 vUv;",

			"varying vec3 vLightWeighting;",

			maxPointLights ? "varying vec3 vPointLightVector[ MAX_POINT_LIGHTS ];" : "",

			"varying vec3 vViewPosition;",

			"varying vec3 vReflect;",
			"uniform float mRefractionRatio;",

			"void main(void) {",

			// world space

			"	vec4 mPosition = objectMatrix * vec4( position, 1.0 );",
			"	vViewPosition = cameraPosition - mPosition.xyz;",

			// this doesn't work on Mac
			//"vec3 nWorld = mat3(objectMatrix) * normal;",
			"	vec3 nWorld = mat3( objectMatrix[0].xyz, objectMatrix[1].xyz, objectMatrix[2].xyz ) * normal;",

			// eye space

			"	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"	vec3 transformedNormal = normalize( normalMatrix * normal );",

			"	if ( !enableLighting ) {",

			"		vLightWeighting = vec3( 1.0, 1.0, 1.0 );",

			"	} else {",

			"		vLightWeighting = ambientLightColor;",

			// directional lights

			maxDirLights ? "for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {" : "",
			maxDirLights ? "	vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );" : "",
			maxDirLights ? "	float directionalLightWeighting = max( dot( transformedNormal, normalize( lDirection.xyz ) ), 0.0 );" : "",
			maxDirLights ? "	vLightWeighting += directionalLightColor[ i ] * directionalLightWeighting;" : "",
			maxDirLights ? "}" : "",

			// point lights

			maxPointLights ? "for( int i = 0; i < MAX_POINT_LIGHTS; i++ ) {" : "",
			maxPointLights ? "	vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );" : "",
			maxPointLights ? "	vPointLightVector[ i ] = normalize( lPosition.xyz - mvPosition.xyz );" : "",
			maxPointLights ? "	float pointLightWeighting = max( dot( transformedNormal, vPointLightVector[ i ] ), 0.0 );" : "",
			maxPointLights ? "	vLightWeighting += pointLightColor[ i ] * pointLightWeighting;" : "",
			maxPointLights ? "}" : "",

			"	}",

			"	vNormal = transformedNormal;",
			"	vUv = uv;",

			"	if ( useRefract ) {",

			"		vReflect = refract( normalize(mPosition.xyz - cameraPosition), normalize(nWorld.xyz), mRefractionRatio );",

			"	} else {",

			"		vReflect = reflect( normalize(mPosition.xyz - cameraPosition), normalize(nWorld.xyz) );",

			"	}",

			"	gl_Position = projectionMatrix * mvPosition;",

			"}"];

		return chunks.join("\n");

	}

	cacheUniformLocations(program, identifiers) {
		identifiers.forEach(id => {
			program.uniforms[id] = this._gl.getUniformLocation(program, id);
		})

	};

	cacheAttributeLocations(program, identifiers) {
		identifiers.forEach(id => {
			program.attributes[id] = this._gl.getAttribLocation(program, id);

			if (program.attributes[id] >= 0) {

				this._gl.enableVertexAttribArray(program.attributes[id]);

			}
		})

	};

	initProgram(maxDirLights, maxPointLights) {
		let _gl = this._gl

		let _program = _gl.createProgram();
		this._program = _program

		_gl.attachShader(_program, this.getShader("fragment", this.generateFragmentShader(maxDirLights, maxPointLights)));
		_gl.attachShader(_program, this.getShader("vertex", this.generateVertexShader(maxDirLights, maxPointLights)));

		_gl.linkProgram(_program);

		if (!_gl.getProgramParameter(_program, _gl.LINK_STATUS)) {

			alert("Could not initialise shaders");

			//alert( "VALIDATE_STATUS: " + _gl.getProgramParameter( _program, _gl.VALIDATE_STATUS ) );
			//alert( _gl.getError() );
		}


		_gl.useProgram(_program);

		// matrices

		_program.viewMatrix = _gl.getUniformLocation(_program, "viewMatrix");
		_program.modelViewMatrix = _gl.getUniformLocation(_program, "modelViewMatrix");
		_program.projectionMatrix = _gl.getUniformLocation(_program, "projectionMatrix");
		_program.normalMatrix = _gl.getUniformLocation(_program, "normalMatrix");
		_program.objMatrix = _gl.getUniformLocation(_program, "objMatrix");

		_program.cameraPosition = _gl.getUniformLocation(_program, 'cameraPosition');

		// lights

		_program.enableLighting = _gl.getUniformLocation(_program, 'enableLighting');

		_program.ambientLightColor = _gl.getUniformLocation(_program, 'ambientLightColor');

		if (maxDirLights) {

			_program.directionalLightNumber = _gl.getUniformLocation(_program, 'directionalLightNumber');
			_program.directionalLightColor = _gl.getUniformLocation(_program, 'directionalLightColor');
			_program.directionalLightDirection = _gl.getUniformLocation(_program, 'directionalLightDirection');

		}

		if (maxPointLights) {

			_program.pointLightNumber = _gl.getUniformLocation(_program, 'pointLightNumber');
			_program.pointLightColor = _gl.getUniformLocation(_program, 'pointLightColor');
			_program.pointLightPosition = _gl.getUniformLocation(_program, 'pointLightPosition');

		}

		// material

		_program.material = _gl.getUniformLocation(_program, 'material');

		// material properties (Basic / Lambert / Blinn-Phong shader)

		_program.mColor = _gl.getUniformLocation(_program, 'mColor');
		_program.mOpacity = _gl.getUniformLocation(_program, 'mOpacity');

		// material properties (Blinn-Phong shader)

		_program.mAmbient = _gl.getUniformLocation(_program, 'mAmbient');
		_program.mSpecular = _gl.getUniformLocation(_program, 'mSpecular');
		_program.mShininess = _gl.getUniformLocation(_program, 'mShininess');

		// texture (diffuse map)

		_program.enableMap = _gl.getUniformLocation(_program, "enableMap");
		_gl.uniform1i(_program.enableMap, 0);

		_program.tMap = _gl.getUniformLocation(_program, "tMap");
		_gl.uniform1i(_program.tMap, 0);

		// material properties (Depth)

		_program.m2Near = _gl.getUniformLocation(_program, 'm2Near');
		_program.mFarPlusNear = _gl.getUniformLocation(_program, 'mFarPlusNear');
		_program.mFarMinusNear = _gl.getUniformLocation(_program, 'mFarMinusNear');

		// vertex arrays

		_program.position = _gl.getAttribLocation(_program, "position");
		_gl.enableVertexAttribArray(_program.position);

		_program.normal = _gl.getAttribLocation(_program, "normal");
		_gl.enableVertexAttribArray(_program.normal);

		_program.uv = _gl.getAttribLocation(_program, "uv");
		_gl.enableVertexAttribArray(_program.uv);


		_program.viewMatrixArray = new Float32Array(16);
		_program.modelViewMatrixArray = new Float32Array(16);
		_program.projectionMatrixArray = new Float32Array(16);

	}

	getShader(type, string) {
		let _gl = this._gl

		var shader;

		if (type == "fragment") {

			shader = _gl.createShader(_gl.FRAGMENT_SHADER);

		} else if (type == "vertex") {

			shader = _gl.createShader(_gl.VERTEX_SHADER);

		}

		_gl.shaderSource(shader, string);
		_gl.compileShader(shader);

		if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {

			alert(_gl.getShaderInfoLog(shader));
			return null;

		}

		return shader;
	}
}