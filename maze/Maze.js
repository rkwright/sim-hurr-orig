/*
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */

var MAZE = {
            revision: '01',

            // 1 << (cardinal_direction)
            SOUTH_BIT : 1,
            WEST_BIT  : 2,
            NORTH_BIT : 4,
            EAST_BIT  : 8,

            //this.EdgeStr = ["S", "W", "N", "E"];
            EdgeBit    : [1, 2, 4, 8],
            OppEdgeBit : [4, 8, 1, 2],
            XEdge      : [0, -1, 0, 1],
            YEdge      : [-1, 0, 1, 0],
            EdgeIndx   : [[-1,  0, -1],
                          [ 1, -1,  3],
                          [-1,  2, -1]]
};

/**
 * Simple little class to hold the coordinates for the stack management
 * @param x
 * @param y
 */
MAZE.Coord = function( x, y ) {

    this.x = x;
    this.y = y;
};

/**
 * Initialize the parameters that control the maze-building
 * process.
 *
 * @param col - number of columns in the maze
 * @param row - number of rows in the maze
 * @param seedX - x-index of seed cell
 * @param seedY - y-index of seed cell
 * @param mazeEvent - callback function for maze Events
 */
MAZE.Maze = function ( col, row, seedX, seedY, mazeEvent ) {

    this.srcKnt = 0;		// count of items in src list

    this.neighbors = [];
    this.maxNeighbors = 0;	// just for info's sake

    this.row = row;         // actual number of rows in maze
    this.col = col;         // actual number of cols in maze

    this.cells = new Uint8Array(this.row * this.col).fill(0);

    this.seedX = seedX;
    this.seedY = seedY;

    this.cells[seedY * this.row + seedX] = 0xff;

    this.mazeEvent = mazeEvent;
};

MAZE.Maze.prototype = {

    /**
     * Builds the maze.  basically, it just starts with the seed and visits
     * that cell and checks if there are any neighbors that have NOT been
     * visited yet.  If so, it adds the to neighbors list.
     */
    build: function () {

        var coord = new MAZE.Coord( this.seedX, this.seedY );

        do {

            this.findNeighbors( coord.x, coord.y );

            var k = this.getRandomInt( 0, this.neighbors.length );

            coord = this.neighbors.splice(k,1)[0];

            //console.log("Dissolving edge for current cell: " + coord.x.toFixed(0) + " " +
            //      coord.y.toFixed() + " k: "  + k.toFixed(2));

            this.dissolveEdge( coord.x, coord.y) ;
        }
        while (this.neighbors.length > 0);
    },

    /**
     * Finds all neighbors of the specified cell.  Each neighbor is pushed onto
     * the "stack" (actually just an array list.
     *
     * @param x - current index into the array
     * @param y
     */
    findNeighbors: function (  x, y ) {

        var     zx,zy;

        for ( var i=0; i<4; i++ ) {

            zx = x + MAZE.XEdge[i];
            zy = y + MAZE.YEdge[i];

            // if indicies in range and cell still zero then the cell is still in the "src list"
            if (zx >= 0 && zx < this.col && zy >= 0 && zy < this.row &&
                        this.cells[zy * this.row + zx] === 0) {

                this.cells[zy * this.row + zx] = 0xf0;

                this.neighbors.push(new MAZE.Coord(zx,zy));

                //console.log("Adding to neighbors: " + zx.toFixed(0) + " " + zy.toFixed(0));

                if (this.neighbors.length > this.maxNeighbors)
                    this.maxNeighbors = this.neighbors.length;

                this.srcKnt--;
            }
        }
    },

    /**
     * Dissolves the edge between the specified cell and one of the
     * adjacent cells in the spanning tree.  However, it does so ONLY
     * if the adjacent cell is already part of the "maze tree", i.e.
     * it won't open a cell into an unvisited cell.
     * The algorithm is such that it is guaranteed that each cell will
     * only be visited once.
     *
     * @param x - cur index
     * @param y
      * return - true if added to the tree
     */
    dissolveEdge: function( x, y ) {

        var		edg;
        var     edgeRay = [];
        var		zx,zy;
        var     cellVal;

        // build the fence for this cell
        maze.cells[y * this.row + x] = 0xff;

        for ( var i=0; i<4; i++ ) {
            // set local variables
            zx = x + MAZE.XEdge[i];
            zy = y + MAZE.YEdge[i];

            cellVal = this.cells[zy * this.row + zx] & MAZE.OppEdgeBit[i];
             // if indicies in range
            if ( zx >= 0 && zx < this.col && zy >= 0 && zy < this.row && cellVal !== 0 ) {

                edgeRay.push( i );
            }
        }

        if ( edgeRay.length > 0 ) {

            var n = this.getRandomInt(0, edgeRay.length);
            edg = edgeRay[n];
            zx  = x + MAZE.XEdge[edg];
            zy  = y + MAZE.YEdge[edg];

            maze.cells[y * this.row + x]   ^= MAZE.EdgeBit[edg];
            maze.cells[zy * this.row + zx] ^= MAZE.OppEdgeBit[edg];

            //console.log("In cell " + x.toFixed(0) + " " + y.toFixed(0) +
             //   " dissolving edge: " + this.EdgeStr[edg] + " into cell: " + zx.toFixed(0) + " " + zy.toFixed(0));
        }
    },

    /**
     * Get a random integer between the minimum and the maximum.  The result may include the minimum
     * but will NOT include the maximum.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     *
     * @param min
     * @param max
     */
    getRandomInt: function ( min, max ) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    },

    /**
     * @param col
     * @param row
     */
    dumpEdges: function(  col, row ) {
        for ( var  i=0; i<row; i++)
            for ( var  j=0; j<col; j++ )
            {
                var mz = this.cells[i * this.row + j];
                console.log(i.toFixed(0) + " " + j.toFixed(0) +
                    " S: " + (mz & MAZE.SOUTH_BIT) + " W: " + (mz & MAZE.WEST_BIT) +
                    " N: " + (mz & MAZE.NORTH_BIT) + " E: " + (mz & MAZE.EAST_BIT)  );
            }
    }
};


