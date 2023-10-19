import Face4 from "../core/Face4";
import Geometry from "../core/Geometry";
import UV from "../core/UV";
import Vector3 from "../core/Vector3";
import Vertex from "../core/Vertex";


export default class Cube extends Geometry {

    constructor(width, height, depth, segments_width, segments_height, materials, flipped, sides) {
        super()

        var scope = this,
        width_half = width / 2,
        height_half = height / 2,
        depth_half = depth / 2,
        flip = flipped ? - 1 : 1;

        if ( materials !== undefined ) {

            if ( materials instanceof Array ) {
    
                this.materials = materials;
    
            } else {
    
                this.materials = [];
    
                for ( var i = 0; i < 6; i ++ ) {
    
                    this.materials.push( [ materials ] );
    
                }
    
            }
    
        } else {
    
            this.materials = [];
    
        }

        this.sides = { px: true, nx: true, py: true, ny: true, pz: true, nz: true };

        if( sides != undefined ) {
    
            for( var s in sides ) {
    
                if ( this.sides[ s ] != undefined ) {
    
                    this.sides[ s ] = sides[ s ];
    
                }
    
            }
    
        }

        this.sides.px && buildPlane( 'z', 'y',   1 * flip, - 1, depth, height, - width_half, this.materials[ 0 ] ); // px
        this.sides.nx && buildPlane( 'z', 'y', - 1 * flip, - 1, depth, height, width_half, this.materials[ 1 ] );   // nx
        this.sides.py && buildPlane( 'x', 'z',   1 * flip,   1, width, depth, height_half, this.materials[ 2 ] );   // py
        this.sides.ny && buildPlane( 'x', 'z',   1 * flip, - 1, width, depth, - height_half, this.materials[ 3 ] ); // ny
        this.sides.pz && buildPlane( 'x', 'y',   1 * flip, - 1, width, height, depth_half, this.materials[ 4 ] );   // pz
        this.sides.nz && buildPlane( 'x', 'y', - 1 * flip, - 1, width, height, - depth_half, this.materials[ 5 ] ); // nz

        mergeVertices();

        function buildPlane( u, v, udir, vdir, width, height, depth, material ) {

            var gridX = segments_width || 1,
            gridY = segments_height || 1,
            gridX1 = gridX + 1,
            gridY1 = gridY + 1,
            segment_width = width / gridX,
            segment_height = height / gridY,
            offset = scope.vertices.length, w;
    
            if ( ( u == 'x' && v == 'y' ) || ( u == 'y' && v == 'x' ) ) {
    
                w = 'z';
    
            } else if ( ( u == 'x' && v == 'z' ) || ( u == 'z' && v == 'x' ) ) {
    
                w = 'y';
    
            } else if ( ( u == 'z' && v == 'y' ) || ( u == 'y' && v == 'z' ) ) {
    
                w = 'x';
    
            }
    
    
            for( let iy = 0; iy < gridY1; iy++ ) {
    
                for( let ix = 0; ix < gridX1; ix++ ) {
    
                    var vector = new Vector3();
                    vector[ u ] = ( ix * segment_width - width_half ) * udir;
                    vector[ v ] = ( iy * segment_height - height_half ) * vdir;
                    vector[ w ] = depth;
    
                    scope.vertices.push( new Vertex( vector ) );
    
                }
    
            }
    
            for( let iy = 0; iy < gridY; iy++ ) {
    
                for( let ix = 0; ix < gridX; ix++ ) {
    
                    var a = ix + gridX1 * iy;
                    var b = ix + gridX1 * ( iy + 1 );
                    var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
                    var d = ( ix + 1 ) + gridX1 * iy;
    
                    scope.faces.push( new Face4( a + offset, b + offset, c + offset, d + offset, null, material ) );
                    scope.uvs.push( [
                                new UV( ix / gridX, iy / gridY ),
                                new UV( ix / gridX, ( iy + 1 ) / gridY ),
                                new UV( ( ix + 1 ) / gridX, ( iy + 1 ) / gridY ),
                                new UV( ( ix + 1 ) / gridX, iy / gridY )
                            ] );
    
                }
    
            }
    
        }
    
        function mergeVertices() {
    
            const unique = [], changes = [];

            scope.vertices.forEach((vertex, i) => {
                let duplicate = false;

                unique.forEach((vu, index) => {
                    if( vertex.position.x == vu.position.x && vertex.position.y == vu.position.y && vertex.position.z == vu.position.z ) {
    
                        changes[ i ] = index;
                        duplicate = true;
    
                    }
                })
    
                if ( ! duplicate ) {
    
                    changes[ i ] = unique.length;
                    unique.push( new Vertex( vertex.position.clone() ) );
    
                }
            })
    
            scope.faces.forEach(face => {
                face.a = changes[ face.a ];
                face.b = changes[ face.b ];
                face.c = changes[ face.c ];
                face.d = changes[ face.d ];
            })
    
            scope.vertices = unique;
    
        }
    
    
        this.computeCentroids();
        this.computeFaceNormals();
        this.sortFacesByMaterial();
    }
}