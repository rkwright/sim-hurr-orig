/*
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */

var BASIN = {
            revision : 'r01',
            QNUMER   : 1.0,	 // numerator of slope f(Q) eqn.
            QEXPON   : 0.1,    // exponent of slope f(Q) eqn
            QINTCP   : 2.0,    // offset for slope f(Q) eqn
            RUGOSITY : 0.5    // degree of rugosity (channel interfluve height)
};

BASIN.GeoCell = function () {

    this.order     = -1;	// stream order of this cell, -1 means not set
    this.area      = 1;     //  Init as 1 - every basin must be its own contributor!
    this.chanLen   = 0;     // channel length below this cell
    this.exit      = 0;     // side on which stream exits cell
    this.elev      = 0;     // elevation of outlet itbthis
    this.chanElev  = 0;     // elev of channel, in maze units
    this.chanSlope = 0;		// slope of chanel, in maze units
};

/**
 * Constuctor
 */

BASIN.Basin = function () {

    this.catch = null;

    this.rat = null;

    this.cells = [];

    this.firstOrder = [];

    this.elevScale = 1;

    bthis = this;
};

BASIN.Basin.prototype = {

    /**
     * Construct the catchment (maze) then walk the maze twice to
     * get the channel and morphology parameters.
     */
    construct: function () {

        var	NCELLS = 16;
        this.elevScale = 4 / NCELLS;

        this.catch = new MAZE.Maze( NCELLS, NCELLS, 0, 0 );

        this.catch.build();

        for ( var i = 0; i < this.catch.row; i++ ) {
            this.cells[i] = [];

            for ( var j = 0; j < this.catch.col; j++ ) {
                this.cells[i][j] = new BASIN.GeoCell();
            }
        }

        this.rat = new MAZE.MazeRat( this.catch );

        this.rat.initSolveObj(0x80, false, this.getMorphParms);

        this.rat.findSolution( -1, -1 );

        this.rat.retraceSteps();

        this.rat.initSolveObj(0x80, true, this.getChanParms);

        this.rat.findSolution( -1, -1 );
    },

    /**
     * First pass the rat is going up to each cul-de-sac (first order basin) and
     * then retracing its steps back down and reporting the results.
     */
    getMorphParms: function( label, rat,  i,  j, nexi, nexj, pathlen, bSac ) {
        var	x0,y0;
        var curC = bthis.cells[i][j];
        var nexC = (nexi >= 0 && nexj >=  0) ? bthis.cells[nexi][nexj] : undefined;
        x0 = nexj - j + 1;
        y0 = nexi - i + 1;

        curC.exit = MAZE.EdgeIndx[y0][x0];

        // if this is a cul-de-sac, then init it to be 1, i.e. first order
        if ( bSac )
            curC.order = 1;

        curC.chanSlope = (BASIN.QNUMER / Math.pow( curC.area + BASIN.QINTCP, BASIN.QEXPON)) * bthis.elevScale;

        if (nexC !== undefined) {
            nexC.area += curC.area;

            if (nexC.order === curC.order)
               nexC.order++;
            else if (nexC.order === -1)
                nexC.order = curC.order;

            console.log(" Morph: i,j: " + i.toFixed(0) + " " + j.toFixed(0) + " nexti,j: " + nexi.toFixed(0) + " " + nexj.toFixed(0) +
                " next_area: " + nexC.area.toFixed(0) + " order: " + curC.order.toFixed(0) +
                " next_order: " + nexC.order.toFixed(0) + " chanSlope: " +  curC.chanSlope.toFixed(3));
        }
        else
            console.log(" Morph: i,j: " + i.toFixed(0) + " " + j.toFixed(0) + " nexti,j: " + -1 + " " + -1 +
                " next_area: " + -1 + " order: " + curC.order.toFixed(0) +
                " next_order: " + -1 + " chanSlope: " +  curC.chanSlope.toFixed(3));

    },

    /**
     * If we are in the second pass and GOING UP the stream network (maze)
     * then we calculate the elevation of each catchment elm as the elevation
     * of the elm we are leaving (into which this elm flows) and the slope
     * of the elm we are leaving.  We do this on the second pass since during
     * the first pass we don't know the slope of each elm because we don't
     * know the area contributing to each elm until the whole basin has been
     * traversed.
     */
    getChanParms: function( label, rat,  i,  j, previ, prevj, pathlen, bSac ) {

        var curC = bthis.cells[i][j];
        var prevC = (previ >= 0 && prevj >= 0) ? bthis.cells[previ][prevj] : undefined;

        if (prevC !== undefined)
            curC.chanElev = prevC.chanElev + prevC.chanSlope;

        if (bSac) {
            // save position in Sack list
            bthis.firstOrder.push( MAZE.Coord(i, j));

            // chan_leng is the length of the mouse's current travels!
            curC.m_chanLen = pathlen;
        }

        if (prevC !== undefined)
            console.log("Chan: From: i,j: " + previ.toFixed(0) + " " + prevj.toFixed(0) +
                " To i,j: " + i.toFixed(0) + " " + j.toFixed(0) + " elev: " + curC.chanElev.toFixed(3) );
        else
            console.log("Chan: From: i,j: " + -1 + " " + -1 +
                " to i,j: " + i.toFixed(0) + " " + j.toFixed(0) + " elev: " + 0 );

    }
};


