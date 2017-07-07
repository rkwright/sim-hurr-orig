/*
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */

var MAZE = { revision: '01' };

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

    // the cardinal directions
    /*
    this.SOUTH = 0;
    this.WEST = 1;
    this.NORTH = 2;
    this.EAST = 3;
    */

    // 1 << (cardinal_direction)
    this.SOUTH_BIT = 1;
    this.WEST_BIT = 2;
    this.NORTH_BIT = 4;
    this.EAST_BIT = 8;

    // 0xff << (cardinal_shift)
    this.SOUTH_MASK = 0x000000ff;
    this.WEST_MASK = 0x0000ff00;
    this.NORTH_MASK = 0x00ff0000;
    this.EAST_MASK = 0xff000000;

    // (log2 (cardinal_direction)) << 3
    this.SOUTH_SHIFT = 0;
    this.WEST_SHIFT = 8;
    this.NORTH_SHIFT = 16;
    this.EAST_SHIFT = 24;

    this.EdgeStr = ["S", "W", "N", "E"];
    this.EdgeBit = [this.SOUTH_BIT, this.WEST_BIT, this.NORTH_BIT, this.EAST_BIT];
    this.OppEdgeBit = [this.NORTH_BIT, this.EAST_BIT, this.SOUTH_BIT, this.WEST_BIT];
    this.XEdge    = [0, -1, 0, 1];
    this.YEdge    = [-1, 0, 1, 0];
    this.EdgeIndx = [[-1,  0, -1],
                     [ 1, -1,  3],
                     [-1,  2, -1]];

    //this.DirShift = [MAZE.SOUTH_SHIFT, MAZE.WEST_SHIFT, MAZE.NORTH_SHIFT, MAZE.EAST_SHIFT];
    //this.DirMask = [MAZE.SOUTH_MASK, MAZE.WEST_MASK, MAZE.NORTH_MASK, MAZE.EAST_MASK];

    this.srcKnt = 0;		// count of items in src list

    this.neighbors = [];
    this.queue = [];

    this.maxNeighbors = 0;	// just for info's sake
    this.nStep = 0;

    this.row = row;         // actual number of rows in maze
    this.col = col;         // actual number of cols in maze

    this.srcKnt = col * row;

    this.cells = new Uint8Array(this.row * this.col).fill(0);

    this.seedX = this.curX = seedX;
    this.seedY = this.curY = seedY;

    //this.cells[seedY * this.row + seedX] = 0x0f;

    //this.srcKnt--;

    this.maxNeighbors = 0;

    this.enqueueCell( new MAZE.Coord( this.curX, this.curY ));

    this.mazeEvent = mazeEvent;
};

MAZE.Maze.prototype = {

    /**
     * Builds the maze.  basically, it just starts with the seed and visits
     * that cell and checks if there are any neighbors that have NOT been
     * visited yet.  If so, it adds the to neighbors list.
     */
    build: function ()
    {
        do {

            if (this.srcKnt > 0)
                this.findNeighbors(  this.curX, this.curY );

            var k = this.getRandomInt( 0, this.neighbors.length );

            var c = this.neighbors.splice(k,1);
            this.curX = c[0].x;
            this.curY = c[0].y;

            //console.log("Dissolving edge for current cell: " + this.curX.toFixed(0) + " " +  this.curY.toFixed() + " k: "  + k.toFixed(2));

            this.dissolveEdge( c[0].x, c[0].y);
        }
        while (this.neighbors.length > 0);
    },

    buildBFS: function ()
    {
        var k,dir = 0;

        while (this.queue.length > 0) {

            var coord = this.dequeueCell();

            this.findNeighbors(  coord.x, coord.y );

            console.log("Neighbors: " + this.neighbors.length);
            while (this.neighbors.length > 0) {

                k = this.getRandomInt(0, this.neighbors.length);

                var c = this.neighbors.splice(k, 1);

                this.enqueueCell(c[0]);

                console.log("Dissolving edge for current cell: " + coord.x.toFixed(0) + " " +
                    coord.y.toFixed() + " into: " + c[0].x.toFixed(0) + " " + c[0].y.toFixed());

                this.dissolveEdgeS(coord.x, coord.y, c[0].x, c[0].y);
            }
        }

    },

    buildDFS: function ()
    {
        var k,dir = 0;

        while (this.queue.length > 0) {

            var coord = this.popCell();
            console.log("Coord: " + coord.x.toFixed(0) + " " + coord.y.toFixed());

            this.findNeighbors( coord.x, coord.y );

            console.log("Neighbors: " + this.neighbors.length);
            while (this.neighbors.length > 0) {

                k = this.getRandomInt(0, this.neighbors.length);

                var c = this.neighbors.splice(k, 1);

                this.pushCell(c[0]);

                console.log("Dissolving edge for current cell: " + coord.x.toFixed(0) + " " +
                    coord.y.toFixed() + " into: " + c[0].x.toFixed(0) + " " + c[0].y.toFixed());

                this.dissolveEdgeS(coord.x, coord.y, c[0].x, c[0].y);
            }
        }

    },

    enqueueCell: function ( coord ) {
        this.cells[coord.y * this.row + coord.x] = 0xff;
        this.queue.push( coord );
    },

    dequeueCell: function () {
        return this.queue.shift();
    },

    pushCell: function ( coord ) {
        this.cells[coord.y * this.row + coord.x] = 0xff;
        this.queue.push( coord );
    },

    popCell: function () {
        return this.queue.pop();
    },



    /**
     * Finds all neighbors of the specified cell.  Each neighbor is pushed onto
     * the "stack" (actually just an array list.
     *
     * @param x - current index into the array
     * @param y
     *
     */
    findNeighbors: function (  x, y ) {

        var	    found = false;
        var     zx,zy;

        for ( var i=0; i<4; i++ )
        {
            // set local variables
            zx = x + this.XEdge[i];
            zy = y + this.YEdge[i];

            // if indicies in range and cell still zero then
            // the cell is still in the "src list"

            if (zx >= 0 && zx < this.col && zy >= 0 && zy < this.row &&
                        this.cells[zy * this.row + zx] === 0) {

                this.cells[zy * this.row + zx] = 0xf0;

                this.neighbors.push(new MAZE.Coord(zx,zy));

                //console.log("Adding to neighbors: " + zx.toFixed(0) + " " + zy.toFixed(0));

                if (this.neighbors.length > this.maxNeighbors)
                    this.maxNeighbors = this.neighbors.length;

                this.srcKnt--;

                found = true;
            }
        }

        return found;
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
            zx = x + this.XEdge[i];
            zy = y + this.YEdge[i];

            cellVal = this.cells[zy * this.row + zx] & this.OppEdgeBit[i];
             // if indicies in range
            if ( zx >= 0 && zx < this.col && zy >= 0 && zy < this.row && cellVal !== 0 ) {

                edgeRay.push( i );
            }
        }

        if ( edgeRay.length > 0 ) {

            var n = this.getRandomInt(0, edgeRay.length);
            edg = edgeRay[n];
            zx  = x + this.XEdge[edg];
            zy  = y + this.YEdge[edg];

            maze.cells[y * this.row + x] ^= this.EdgeBit[edg];
            maze.cells[zy * this.row + zx] ^= this.OppEdgeBit[edg];

            //console.log("In cell " + x.toFixed(0) + " " + y.toFixed(0) +
             //   " dissolving edge: " + this.EdgeStr[edg] + " into cell: " + zx.toFixed(0) + " " + zy.toFixed(0));
        }
    },

    dissolveEdgeS: function(  curX, curY, nabX, nabY ) {

        var	x,y;
        var edg = -1;

        do {

            edg++;
            if (edg > 3)
                debugger;

            x = curX + this.XEdge[edg];
            y = curY + this.YEdge[edg];

        } while ( x !== nabX || y !== nabY );

        this.cells[ curY * this.row + curX] ^= this.EdgeBit[edg];
        this.cells[y * this.row + x] ^= this.OppEdgeBit[edg];

        //console.log( " In cell " + this.curX.toFixed(0) + " " + this.curY.toFixed(0) +
        //        " dissolving edge: " + this.EdgeStr[edg] + " into cell: " + x.toFixed(0) + " " + y.toFixed(0) + " " +
        //    this.cells[this.curY * this.row + this.curX].toString(2) + " " + this.cells[y * this.row + x].toString(2));
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
                    " S: " + (mz & this.SOUTH_BIT) + " W: " + (mz & this.WEST_BIT) +
                    " N: " + (mz & this.NORTH_BIT) + " E: " + (mz & this.EAST_BIT)  );
            }
    }
};


