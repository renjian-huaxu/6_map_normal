import Face4 from "../core/Face4";
import Geometry from "../core/Geometry";
import UV from "../core/UV";
import Vector3 from "../core/Vector3";
import Vertex from "../core/Vertex";


export default class Plane extends Geometry {

    constructor(width, height, segments_width, segments_height) {
        super()

        var 
        width_half = width / 2,
        height_half = height / 2,
        gridX = segments_width || 1,
        gridY = segments_height || 1,
        gridX1 = gridX + 1,
        gridY1 = gridY + 1,
        segment_width = width / gridX,
        segment_height = height / gridY;


        for( let iy = 0; iy < gridY1; iy++ ) {

            for( let ix = 0; ix < gridX1; ix++ ) {

                var x = ix * segment_width - width_half;
                var y = iy * segment_height - height_half;

                this.vertices.push( new Vertex( new Vector3( x, - y, 0 ) ) );

            }

        }

        for( let iy = 0; iy < gridY; iy++ ) {

            for( let ix = 0; ix < gridX; ix++ ) {

                var a = ix + gridX1 * iy;
                var b = ix + gridX1 * ( iy + 1 );
                var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
                var d = ( ix + 1 ) + gridX1 * iy;

                this.faces.push( new Face4( a, b, c, d ) );
                this.uvs.push( [
                            new UV( ix / gridX, iy / gridY ),
                            new UV( ix / gridX, ( iy + 1 ) / gridY ),
                            new UV( ( ix + 1 ) / gridX, ( iy + 1 ) / gridY ),
                            new UV( ( ix + 1 ) / gridX, iy / gridY )
                        ] );

            }

        }

        this.computeCentroids();
        this.computeFaceNormals();
        this.sortFacesByMaterial();

    }
}