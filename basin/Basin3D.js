BASIN.Basin3D = function ( nCells ) {

    this.nCells = nCells;
    this.plane = null;
    this.terrain = [];
    this.basin = null;
    this.planeMesh = null;
    this.scale3D = 5 / nCells;


    this.basin = new BASIN.Basin(nCells);

    this.basin.construct();

    this.createTerrain();

    this.computeElevations();

        //dumpTerrain( NCELLS );
        //dumpCells( NCELLS );

    this.createPlaneGeometry();

    this.createPlaneMesh();

        //renderStreams();

    this.renderSides();
};

BASIN.Basin3D.prototype = {

    /**
     * This creates the terrain array but sets elevation to -1 to indicate that
     * it is uninitialized.
     */
    createTerrain: function() {

        for ( var i = 0; i < this.nCells * 2 + 1; i++ ) {
            this.terrain[i] = [];
            for ( var j = 0; j < this.nCells * 2 + 1; j++ ) {
                this.terrain[i][j] = new THREE.Vector3(i * this.scale3D, -1, j * this.scale3D);
            }
        }
    },

    /*
     * This creates the mesh comprised of nCells by nCells quad-patches.
     * Elevations are still all -1
     */
    createPlaneGeometry: function () {

        this.plane = new THREE.Geometry();

        for ( var i = 0; i < this.nCells * 2; i += 2 ) {
            for ( var j = 0; j < this.nCells * 2; j += 2 ) {
                this.createQuadPatch(i, j);
            }
        }

        this.plane.computeFaceNormals();
        this.plane.computeVertexNormals();
    },

    /**
     * Walk the existing geometry and compute, for each quad-patch
     * the elevations of the vertices.
     */
    computeElevations: function () {

        for ( var i = 0; i < this.nCells; i++ ) {
            for ( var j = 0; j < this.nCells; j++ ) {
                this.computeCellElevations(i, j);
            }
        }
    },

    /**
     *  Create the actual mesh from the geometry and some fakes material.
     */
    createPlaneMesh: function() {

        var vertexMat = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, side: THREE.DoubleSide});

        this.planeMesh = new THREE.Mesh(this.plane, vertexMat);

        // and add it to the scene
        gfxScene.add(this.planeMesh);
        this.planeMesh.position.set(-this.nCells * this.scale3D, 0, -this.nCells * this.scale3D);
    },

    /**
     * Compute the elevation of the 9 vertices that make up each quad-patch
     */
    computeCellElevations: function ( i, j ) {
        // get the cell for convenience and the terrain indices
        var bounds = this.basin.maze.cells[i * this.basin.maze.row + j];
        var cell = this.basin.geos[i][j];
        var it = i * 2 + 1;
        var jt = j * 2 + 1;
        // first set the center of the cell, which is already computed
        this.terrain[it][jt].y = cell.chanElev;

        // next, check each edge and see if this cell has a stream to the next
        // if so, simply interpolate between the two slopes
        this.computeStreamElev(bounds, cell, i, j);

        // now check the other interpolated points
        this.computeElevBounds(bounds, i, j);
    },

    /**
     * Compute the interpolated elevation of any streams entering or leaving the cell
     */
    computeStreamElev: function ( bounds, cell, i, j )  {
        var it = i * 2 + 1;
        var jt = j * 2 + 1;
        var eI, eJ;

        if ((bounds & MAZE.SOUTH_BIT) === 0) {
            eI = Math.max(i + MAZE.YEdge[MAZE.SOUTH], 0);
            eJ = Math.max(j + MAZE.XEdge[MAZE.SOUTH], 0);
            this.terrain[it - 1][jt].y = (cell.chanElev + this.basin.geos[eI][eJ].chanElev) / 2;
        }

        if ((bounds & MAZE.WEST_BIT) === 0) {
            eI = Math.max(i + MAZE.YEdge[MAZE.WEST], 0);
            eJ = Math.max(j + MAZE.XEdge[MAZE.WEST], 0);
            this.terrain[it][jt - 1].y = (cell.chanElev + this.basin.geos[eI][eJ].chanElev) / 2;
        }

        if ((bounds & MAZE.NORTH_BIT) === 0) {
            eI = Math.max(i + MAZE.YEdge[MAZE.NORTH], 0);
            eJ = Math.max(j + MAZE.XEdge[MAZE.NORTH], 0);
            this.terrain[it + 1][jt].y = (cell.chanElev + this.basin.geos[eI][eJ].chanElev) / 2;
        }

        if ((bounds & MAZE.EAST_BIT) === 0) {
            eI = Math.max(i + MAZE.YEdge[MAZE.EAST], 0);
            eJ = Math.max(j + MAZE.XEdge[MAZE.EAST], 0);
            this.terrain[it][jt + 1].y = (cell.chanElev + this.basin.geos[eI][eJ].chanElev) / 2;
        }
    },

    /**
     *  Compute the interpolated elevation of each of the 8 points around the periphery of
     *  the cell.  Some, e.g. if there is a stream entering or exiting, will already be computed
     *  so they won't be -1 and can be skipped
     */
    computeElevBounds: function ( bounds, i, j ) {
        var offset =
            [
                {i: -1, j: 0},   // south
                {i: -1, j: -1},
                {i: 0, j: -1},   // west
                {i: 1, j: -1},
                {i: 1, j: 0},   // north
                {i: 1, j: 1},
                {i: 0, j: 1},   // east
                {i: -1, j: 1}
            ];

        try {


            var slopes = [];
            var it, jt;
            var rowLim = this.basin.maze.row - 1;
            var colLim = this.basin.maze.col - 1;
            var tRowLim = this.terrain.length;
            var tColLim = this.terrain[0].length;
            var base = this.basin.geos[i][j].chanElev;

            for (var n = 0; n < 8; n++) {
                it = i * 2 + offset[n].i + 1;
                jt = j * 2 + offset[n].j + 1;

                // if the current point is a stream, then obviously it's not an interfluve
                var bStream = ((bounds & MAZE.SOUTH_BIT) === 0 && n === 0 ) ||
                    ((bounds & MAZE.WEST_BIT) === 0 && n === 2 ) ||
                    ((bounds & MAZE.NORTH_BIT) === 0 && n === 4 ) ||
                    ((bounds & MAZE.EAST_BIT) === 0 && n === 6 );

                if (it >= 0 && it < tRowLim && jt >= 0 && jt < tColLim && !bStream) {

                    switch (n) {
                        case 0:     // south
                            if (i !== 0) {
                                slopes.push(this.basin.geos[i - 1][j].chanSlope);
                            }
                            break;
                        case 1:     // southwest
                            if (i !== 0 && j !== 0) {
                                slopes.push(this.basin.geos[i - 1][j - 1].chanSlope);
                            }
                            if (j !== 0) {
                                slopes.push(this.basin.geos[i][j - 1].chanSlope);
                            }
                            if (i !== 0) {
                                slopes.push(this.basin.geos[i - 1][j].chanSlope);
                            }
                            break;
                        case 2:     // west
                            if (j !== 0) {
                                slopes.push(this.basin.geos[i][j - 1].chanSlope);
                            }
                            break;
                        case 3:     // northwest
                            if (i !== 0) {
                                slopes.push(this.basin.geos[i - 1][j].chanSlope);
                            }
                            if (i !== rowLim && j !== 0) {
                                slopes.push(this.basin.geos[i + 1][j - 1].chanSlope);
                            }
                            if (i !== rowLim) {
                                slopes.push(this.basin.geos[i + 1][j].chanSlope);
                            }
                            break;
                        case 4:     // north
                            if (i !== rowLim) {
                                slopes.push(this.basin.geos[i + 1][j].chanSlope);
                            }
                            break;
                        case 5:     // northeast
                            if (i !== rowLim) {
                                slopes.push(this.basin.geos[i + 1][j].chanSlope);
                            }
                            if (j !== colLim) {
                                slopes.push(this.basin.geos[i][j + 1].chanSlope);
                            }
                            if (i !== rowLim && j !== colLim) {
                                slopes.push(this.basin.geos[i + 1][j + 1].chanSlope);
                            }
                            break;
                        case 6:     // east
                            if (j !== colLim) {
                                slopes.push(this.basin.geos[i][j + 1].chanSlope);
                            }
                            break;
                        case 7:     // southeast
                            if (i !== rowLim) {
                                slopes.push(this.basin.geos[i + 1][j].chanSlope);
                            }
                            if (j !== colLim) {
                                slopes.push(this.basin.geos[i][j + 1].chanSlope);
                            }
                            if (i !== 0 && j !== colLim) {
                                slopes.push(this.basin.geos[i - 1][j + 1].chanSlope);
                            }
                            break;
                    }

                    slopes.push(this.basin.geos[i][j].chanSlope);

                    this.terrain[it][jt].y = Math.max(this.terrain[it][jt].y, this.interfluveHeight(slopes, base));
                    if (this.terrain[it][jt].y < 0)
                        debugger;
                }
            }
        }
        catch (err) {
            console.log("Bummer");
        }
    },

    /**
     * Simple function to calc the height of the interfluve from surrounding
     * calculated stream heights.
     */
    interfluveHeight: function ( slopes, base  ) {
        var h = 0;

        while (slopes.length > 0) {
            h = Math.max(h, slopes.pop());
        }

        return h * 2 + base;
    },

    /**
     *  Create the 8 triangles that comprise each quad-patch
     */
    createQuadPatch: function ( i, j ) {
        var vC = this.plane.vertices.length;
        var face;

        // first pair of triangles
        this.plane.vertices.push(this.terrain[i][j]);
        this.plane.vertices.push(this.terrain[i][j + 1]);
        this.plane.vertices.push(this.terrain[i + 1][j + 1]);
        this.plane.vertices.push(this.terrain[i + 1][j]);

        face = new THREE.Face3(vC, vC + 1, vC + 2);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);

        face = new THREE.Face3(vC, vC + 2, vC + 3);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);

        // second pair of triangles
        vC = this.plane.vertices.length;
        this.plane.vertices.push(this.terrain[i][j + 1]);
        this.plane.vertices.push(this.terrain[i][j + 2]);
        this.plane.vertices.push(this.terrain[i + 1][j + 2]);
        this.plane.vertices.push(this.terrain[i + 1][j + 1]);

        face = new THREE.Face3(vC, vC + 1, vC + 3);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);

        face = new THREE.Face3(vC + 1, vC + 2, vC + 3);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);

        // third pair of triangles
        vC = this.plane.vertices.length;
        this.plane.vertices.push(this.terrain[i + 1][j + 1]);
        this.plane.vertices.push(this.terrain[i + 1][j + 2]);
        this.plane.vertices.push(this.terrain[i + 2][j + 2]);
        this.plane.vertices.push(this.terrain[i + 2][j + 1]);

        face = new THREE.Face3(vC, vC + 1, vC + 2);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);

        face = new THREE.Face3(vC, vC + 2, vC + 3);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);

        // fourth pair of triangles
        vC = this.plane.vertices.length;
        this.plane.vertices.push(this.terrain[i + 1][j]);
        this.plane.vertices.push(this.terrain[i + 1][j + 1]);
        this.plane.vertices.push(this.terrain[i + 2][j + 1]);
        this.plane.vertices.push(this.terrain[i + 2][j]);

        face = new THREE.Face3(vC, vC + 1, vC + 3);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);

        face = new THREE.Face3(vC + 1, vC + 2, vC + 3);
        face.vertexColors[0] = new THREE.Color(0x598527);
        face.vertexColors[1] = new THREE.Color(0x598527);
        face.vertexColors[2] = new THREE.Color(0x598527);
        this.plane.faces.push(face);
    },

    renderSides: function() {

        var maxZ = this.terrain[0][this.basin.maze.row * 2 - 1].z * this.scale3D;
        var maxX = this.terrain[this.basin.maze.row * 2 - 1][0].x * this.scale3D;
        var maxYX = this.terrain[this.basin.maze.row * 2 - 1][0].y * this.basin.elevScale;
        var maxYZ = this.terrain[0][this.basin.maze.row * 2 - 1].y * this.basin.elevScale;
        var maxYXZ = this.terrain[this.basin.maze.row * 2 - 1][this.basin.maze.row * 2 - 1].y * this.basin.elevScale;
        var nCS = -this.nCells / 2 * this.scale3D;

        var shape = new THREE.Shape();

        /*
        shape.moveTo(nCS, 0);
        shape.lineTo(maxX, 0);
        shape.lineTo(maxX, maxYX);
        shape.lineTo(nCS, 0);
        */

        shape.moveTo(0, 0);
        shape.lineTo(10, 0);
        shape.lineTo(10, 10);
        shape.lineTo(0, 0);

        var material = new THREE.MeshBasicMaterial({color: 0xff0000});
        var shapeMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
        gfxScene.add(shapeMesh);
    }

    /*
    renderStreams: function () {
        this.basin.rat.initSolveObj(0x80, false, renderStream);

        this.basin.rat.findSolution(-1, -1);
    },

    renderStream: function (label, rat, i, j, nexi, nexj, pathlen, bsac) {

        var material = new THREE.LineBasicMaterial({color: 0x0000ff});

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(2 * i + 1 - NCELLS, 3, 2 * j + 1 - NCELLS));
        geometry.vertices.push(new THREE.Vector3(2 * nexi + 1 - NCELLS, 3, 2 * nexj + 1 - NCELLS));

        var line = new THREE.Line(geometry, material);

        gfxScene.add(line);
    },

    dumpTerrain: function () {

        for (var i = 0; i < this.nCells * 2 + 1; i++) {

            console.log(i.toFixed(0) + " : " + this.terrain[i][0].y.toFixed(3) + " " + this.terrain[i][1].y.toFixed(3) + " " +
                this.terrain[i][2].y.toFixed(3) + " " + this.terrain[i][3].y.toFixed(3) + " " + this.terrain[i][4].y.toFixed(3) + " " +
                this.terrain[i][5].y.toFixed(3) + " " + this.terrain[i][6].y.toFixed(3) + " " + this.terrain[i][7].y.toFixed(3) + " " +
                this.terrain[i][8].y.toFixed(3));
        }

    },

    dumpCells: function () {

        for (var i = 0; i < this.nCells; i++) {

            console.log(i.toFixed(0) + " : " + this.basin.geos[i][0].chanElev.toFixed(3) + " " + this.basin.geos[i][1].chanElev.toFixed(3) + " " +
                this.basin.geos[i][2].chanElev.toFixed(3) + " " + this.basin.geos[i][3].chanElev.toFixed(3));
        }
    },
    */

};