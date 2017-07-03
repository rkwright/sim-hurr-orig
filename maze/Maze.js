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

    this.maxNeighbors = 0;	// just for info's sake
    this.nStep = 0;

    this.row = row;         // actual number of rows in maze
    this.col = col;         // actual number of cols in maze

    this.srcKnt = col * row;

    this.cells = new Int8Array(this.row * this.col).fill(0);

    this.seedX = seedX;
    this.seedY = seedY;
    this.cells[seedY * this.row + seedX] = 0xff;

    this.curX = seedX;
    this.curY = seedY;

    this.srcKnt--;

    this.maxNeighbors = 0;

    this.mazeEvent = mazeEvent;
};

MAZE.Maze.prototype = {

    /**
     * Builds the maze.  basically, it just starts with the seed and visits
     * that cell and checks if there are any neighbors that have NOT been
     * visited yet.  If so, it adds the to neighbors list.
     *
     * Then it randomly removes one of the current set of unvisited neighbors
     * and visits that cell and tries to connect it to surrounding cells that
     * been visited, i.e. add that cell to the tree.
     */
    build: function ()
    {
        do
        {
            if (this.srcKnt > 0)
                this.findNeighbors(  this.curX, this.curY );

            var k = this.getRandomInt(0, this.neighbors.length);

            var c = this.neighbors.splice( k, 1 );
            this.curX = c[0].x;
            this.curY = c[0].y;

            console.log("Dissolving edge for current cell: " + this.curX.toFixed(0) + " " +  this.curY.toFixed() + " k: "  + k.toFixed(2));
            this.dissolveEdge( this.curX, this.curY);
        }
        while (this.neighbors.length > 0);
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

            // if indicies in range and m_data cell still zero then
            // the cell is still in the "src list"

            if (zx >= 0 && zx < this.col && zy >= 0 && zy < this.row &&
                        this.cells[zy * this.row + zx] === 0) {
                this.cells[zy * this.row + zx] = 0xf0;

                this.neighbors.push(new MAZE.Coord(zx,zy));

                console.log("Adding to neighbors[" + this.neighbors.length.toFixed(0) + " : "
                        + zx.toFixed(0) + " " + zy.toFixed(0));

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
     * @param x - current index into the array
     * @param y
     * return - true if added to the tree
     */
    dissolveEdge: function(  x, y ) {

        var		nabknt = 0;
        var		edg;
        var 	EdgeRay = [ 0,0,0,0 ];
        var		zx,zy;

        // build the fence for this cell
        this.cells[y * this.row + x] = 0xff;

        for ( var i=0; i<4; i++ ) {

            zx = x + this.XEdge[i];
            zy = y + this.YEdge[i];

            // if indicies in range
            if ( zx >= 0 && zx < this.col && zy >= 0 && zy < this.row &&
                    (this.cells[zy * this.row + zx] & this.OppEdgeBit[i]) !== 0 ) {
                EdgeRay[nabknt++] = i;
            }
        }

        if ( nabknt > 0 )  {

            edg = this.getRandomInt(0, nabknt);
            zx  = x + this.XEdge[edg];
            zy  = y + this.YEdge[edg];

            this.cells[y * this.row + x] ^= this.EdgeBit[edg];  //(1 << edg);
            this.cells[zy * this.row + zx] ^= this.OppEdgeBit[edg];

            console.log(this.nStep.toFixed(0) + " In cell " + x.toFixed(0) + " " + y.toFixed(0) +
                " dissolving edge: " + this.EdgeStr[edg] + " into cell: " + zx.toFixed(0) + " " + zy.toFixed(0));
       }
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     *
     * @param min
     * @param max
     * @returns {*}
     */
    getRandomInt: function ( min, max ) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
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
                    " S: " + mz & MAZE.SOUTH_BIT + " W: " + mz & MAZE.WEST_BIT +
                    " N: " + mz & MAZE.NORTH_BIT + " E: " + mz & MAZE.EAST_BIT  );
            }
    },
	
    /**
     * @see com.geofx.example.erosion.MazeEvent#mazeEvent(int, int, int, int, int, boolean)
     */
    report: function (  description, posx, posy, msx, msy, stackDepth, bSac ) {
        console.log(description + " posx: " +  posx.toFixed(0) + "  posy: " + posy.toFixed(0) + " msx: " + msx.toFixed(0) +
       " msy: " + msy.toFixed(0) + " depth: " + stackDepth.toFixed(0) + " bSac: " + bSac);
    }
};


