/*
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */


MAZE.MazeRat = function( maze, mask, bSingleHit, mazeEvent) {

//	this.   		maxFront;  		// max count of items in front list

    this.bSearch = true;			// true if still searching
    this.bSuccess = false;			// true if search was successful
    this.bSac = false;				// true if last cell was cul-de-sac
    this.targetX = 0;			    // coords of target
    this.targetY = 0;
    this.x = 0;				        // coords of cell
    this.y = 0;
    this.lastX = -1;
    this.lastY = -1;			    // coords of last cell drawn to

    this.stack = []; 			    // solution search stack
    this.mouseStack = [];		    // mouse-values stack

    this.maze = maze;
    this.mask = mask;               // unique mask value for this object
    this.bSingleHit = bSingleHit;
    this.mazeEvent = mazeEvent;

    for (var i = 0; i < this.maze.row; i++)
        for (var j = 0; j < this.maze.col; j++)
            this.maze.cells[i * this.maze.row + j] |= 0xf0;

    // push seed on Stack
    this.stack.push(new MAZE.Coord(this.maze.seedX, this.maze.seedY));
};


MAZE.MazeRat.prototype = {

    /**
     * Solves the specified maze by using a variant of the 4x4 seed fill.
     */
    findSolution: function ( xexit, yexit )	{
        this.targetX = xexit;
        this.targetY = yexit;

        // while Stack not empty...
        while ( this.stack.length > 0 && this.bSearch ) {

            this.solveStep();

            this.updateObject();
        }

        return this.bSuccess;
    },

    /**
     *  This func solves one step for the specified by maze by using a variant
     *  of the 4x4 seed fill.
     */
    solveStep: function ()	{
        var		px,py;
        var		mazval,zx,zy;

        // pop next value from Stack
        var c = this.stack.pop();
        px = c.x;
        py = c.y;
        this.x = px;
        this.y = py;

        // if exit not yet found...
        if ( px !== this.targetX || py !== this.targetY )
        {
            mazval = this.maze.cells[py * this.maze.row + px];

            if (this.mazeEvent !== null)
                this.report("   solveStep",  px,  py,  -1,  -1,  this.stack.length, false);

            // turn off top bit to show this cell has been checked
            this.maze.cells[py * this.maze.row + px] ^= this.mask;

            this.bSac = true;
            for ( var k=0; k<4; k++ )
            {
                zx = px + this.maze.XEdge[k];
                zy = py + this.maze.YEdge[k];

                if ( zx >= 0 && zx < this.maze.col && zy >= 0 && zy < this.maze.row &&
                      (this.maze.cells[zy * this.maze.row + zx] & this.mask) !== 0 &&
                      ((mazval & (1 << k)) === 0) )
                {
                    this.bSac = false;
                    this.stack.push(new MAZE.Coord(zx, zy));
                    if (this.mazeEvent !== null)
                        this.report("    addStack",  px,  py,  zx,  zy,  this.stack.length, false);
                }
            }

            this.bSuccess = false;
        }
        else
            this.bSuccess = true;

        this.bSearch = !this.bSuccess;

        return this.bSearch;
    },

    /**
     * Updates the current position within the "maze".
     */
    updateObject: function ()
    {
        var     msx, msy;
        var     posx, posy;

        // get and save object's current position
        posx = this.lastX = this.x;
        posy = this.lastY = this.y;

        if ( this.bSingleHit ) {
            if ( this.mouseStack.length > 0) {
                msx = this.mouseStack[this.mouseStack.length-1].x;
                msy = this.mouseStack[this.mouseStack.length-1].y;
            }
            else {
                msx = -1;
                msy = -1;
            }

            if (this.mazeEvent !== null)
                this.report( "updateObject", posx, posy, msx, msy, this.stack.length, this.bSac );
        }

        // if cul-de-sac then re-trace "steps"
        if ( this.bSac )
            this.retraceSteps( false );
        else
            // if NOT a cul-de-sac, then save position  on stack
            this.mouseStack.push(new MAZE.Coord(posx,posy));
    },

    /**
     * This func updates the current position within the "maze".
     */
    retraceSteps: function ( last_step ) {
        var		    adjacent = false;
        var			msx, msy;
        var			posx, posy;
        var			mazval, edg;
//		boolean		bCulDeSac = true;
        var 		coord;

        //if (stack.size() == 0 && !last_step)
        //	return true;

        this.last_step = this.stack.length === 0;

        // Get ACTUAL next position from Main Stack , i.e. the pos to which we
        // must retrace our steps.  Note that we have to handle the last step
        // specially because the stack is now empty.
        if (this.last_step) {
            posx = this.maze.seedX;
            posy = this.maze.seedX;
        }
        else {
            // set the point to retrace to as the next item on the stack
            posx = this.stack[this.stack.length-1].x;
            posy = this.stack[this.stack.length-1].y;
        }

        // get maze value at that position
        mazval = this.maze.cells[posy * this.maze.row + posx];

        do  {
            if ( this.mouseStack.length > 0 ) {
                // pop previous position from mouse-stack
                coord = this.mouseStack.pop();
                msx = coord.x;
                msy = coord.y;

                if ( !this.bSingleHit && this.mazeEvent !== null )
                    this.report( "retraceSteps", this.lastX, this.lastY, msx, msy, this.stack.length, this.bSac );

                // only the first cell is a real cul-de-sac, so clear the local flag
    //			bCulDeSac = false;

                // retrace line to that position
                this.lastX = msx;
                this.lastY = msy;

                // simple computational convenience
                msx -= posx;
                msy -= posy;

                // are we next to the "target"??
                adjacent = ( msx === 0 || msy === 0 )
                                    && ( Math.abs(msy) === 1 || Math.abs(msx) === 1 );

                if ( adjacent && !this.last_step )  {
                    // see if the way is open..
                    edg = this.maze.EdgeIndx[msy+1][msx+1];

                    if ((adjacent = ((mazval & (1 << edg))) === 0))
                        this.mouseStack.push(coord);   // was mouseIndex++;  ??
                }
            }
        }
        while ((this.mouseStack.length > 0) && ( !adjacent || this.last_step ));

        // if this is the end, call back and report that we are exiting the initial seed point
        if (this.last_step) {
            if ( !this.bSingleHit && this.mazeEvent !== null )
                this.report( "retraceSteps", this.maze.seedX, this.maze.seedY, -1, -1, this.stack.length, this.bSac );

        }

        return true;
    },

    /**
     * @see com.geofx.example.erosion.MazeEvent#mazeEvent(int, int, int, int, int, boolean)
     */
    report: function (  description, posx, posy, msx, msy, stackDepth, bSac ) {
        console.log(description + " posx: " +  posx.toFixed(0) + "  posy: " + posy.toFixed(0) + " msx: " + msx.toFixed(0) +
            " msy: " + msy.toFixed(0) + " depth: " + stackDepth.toFixed(0) + " bSac: " + bSac);
    }
};
