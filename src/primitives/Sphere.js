import Face3 from "../core/Face3";
import Geometry from "../core/Geometry";
import UV from "../core/UV";
import Vector3 from "../core/Vector3";
import Vertex from "../core/Vertex";

export default class Sphere extends Geometry {

    constructor(radius, segments_width, segments_height, smooth) {
        
        super()

        var gridX = segments_width || 8,
        gridY = segments_height || 6;
    
        var i, j, pi = Math.PI;
        var iHor = Math.max( 3, gridX );
        var iVer = Math.max( 2, gridY );
        var aVtc = [];
    
        for ( j = 0; j < ( iVer + 1 ) ; j++ ) {
    
            var fRad1 = j / iVer;
            var fZ = radius * Math.cos( fRad1 * pi );
            var fRds = radius * Math.sin( fRad1 * pi );
            var aRow = [];
            var oVtx = 0;
    
            for ( i = 0; i < iHor; i++ ) {
    
                var fRad2 = 2 * i / iHor;
                var fX = fRds * Math.sin( fRad2 * pi );
                var fY = fRds * Math.cos( fRad2 * pi );
    
                if ( !( ( j == 0 || j == iVer ) && i > 0 ) ) {
    
                    oVtx = this.vertices.push( new Vertex( new Vector3( fY, fZ, fX ) ) ) - 1;
    
                }
    
                aRow.push( oVtx );
    
            }
    
            aVtc.push( aRow );
    
        }
    
        var n1, n2, n3, iVerNum = aVtc.length;
    
        for ( j = 0; j < iVerNum; j++ ) {
    
            var iHorNum = aVtc[ j ].length;
    
            if ( j > 0 ) {
    
                for ( i = 0; i < iHorNum; i++ ) {
    
                    var bEnd = i == ( iHorNum - 1 );
                    var aP1 = aVtc[ j ][ bEnd ? 0 : i + 1 ];
                    var aP2 = aVtc[ j ][ ( bEnd ? iHorNum - 1 : i ) ];
                    var aP3 = aVtc[ j - 1 ][ ( bEnd ? iHorNum - 1 : i ) ];
                    var aP4 = aVtc[ j - 1 ][ bEnd ? 0 : i + 1 ];
    
                    var fJ0 = j / ( iVerNum - 1 );
                    var fJ1 = ( j - 1 ) / ( iVerNum - 1 );
                    var fI0 = ( i + 1 ) / iHorNum;
                    var fI1 = i / iHorNum;
    
                    var aP1uv = new UV( 1 - fI0, fJ0 );
                    var aP2uv = new UV( 1 - fI1, fJ0 );
                    var aP3uv = new UV( 1 - fI1, fJ1 );
                    var aP4uv = new UV( 1 - fI0, fJ1 );
    
                    if ( j < ( aVtc.length - 1 ) ) {
    
                        n1 = this.vertices[ aP1 ].position.clone();
                        n2 = this.vertices[ aP2 ].position.clone();
                        n3 = this.vertices[ aP3 ].position.clone();
                        n1.normalize();
                        n2.normalize();
                        n3.normalize();
    
                        this.faces.push( new Face3( aP1, aP2, aP3, [ new Vector3( n1.x, n1.y, n1.z ), new Vector3( n2.x, n2.y, n2.z ), new Vector3( n3.x, n3.y, n3.z ) ] ) );
    
                        this.uvs.push( [ aP1uv, aP2uv, aP3uv ] );
    
                    }
    
                    if ( j > 1 ) {
    
                        n1 = this.vertices[aP1].position.clone();
                        n2 = this.vertices[aP3].position.clone();
                        n3 = this.vertices[aP4].position.clone();
                        n1.normalize();
                        n2.normalize();
                        n3.normalize();
    
                        this.faces.push( new Face3( aP1, aP3, aP4, [ new Vector3( n1.x, n1.y, n1.z ), new Vector3( n2.x, n2.y, n2.z ), new Vector3( n3.x, n3.y, n3.z ) ] ) );
    
                        this.uvs.push( [ aP1uv, aP3uv, aP4uv ] );
    
                    }
    
                }
            }
        }
    
        this.computeCentroids();
        this.computeFaceNormals();
        this.computeVertexNormals();
        this.sortFacesByMaterial();
    
    }
}