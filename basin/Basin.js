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
    this.area      = 1;     // catchment area, in unit cells. Init as 1 - every basin must be its own contributor!
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

    bthis = this;
};

BASIN.Basin.prototype = {

    /**
     * Construct the catchment (maze) then walk the maze twice to
     * get the channel and morphology parameters.
     */
    construct: function () {

        var	NCELLS = 4;

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

        x0 = nexj - j + 1;
        y0 = nexi - i + 1;

        bthis.cells[i][j].exit = MAZE.EdgeIndx[y0][x0];

        // if this is a cul-de-sac, then init it to be 1, i.e. first order
        if ( bSac )
            bthis.cells[i][j].order = 1;

        bthis.cells[i][j].chanSlope = (BASIN.QNUMER / Math.pow( bthis.cells[i][j].area + BASIN.QINTCP, BASIN.QEXPON));

        if (nexi >= 0 && nexj >=  0) {
            bthis.cells[nexi][nexj].area += bthis.cells[i][j].area;

            if (bthis.cells[nexi][nexj].order === bthis.cells[i][j].order)
                bthis.cells[nexi][nexj].order++;
            else if (bthis.cells[nexi][nexj].order === -1)
                bthis.cells[nexi][nexj].order = bthis.cells[i][j].order;

            console.log(" Morph: i,j: " + i.toFixed(0) + " " + j.toFixed(0) + " nexti,j: " + nexi.toFixed(0) + " " + nexj.toFixed(0) +
                " next_area: " + bthis.cells[nexi][nexj].area.toFixed(0) + " [i][j].order: " + bthis.cells[i][j].order.toFixed(0) +
                " [nexi][nexj].order: " + bthis.cells[nexi][nexj].order.toFixed(0) + " chanSlope: " +  bthis.cells[i][j].chanSlope.toFixed(3));
        }
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

        if (previ >= 0 && prevj >= 0)
            bthis.cells[i][j].m_chanElev = bthis.cells[previ][prevj].chanElev +
                bthis.cells[previ][prevj].chanSlope;

        if (bSac) {
            // save position in Sack list
            bthis.firstOrder.push( MAZE.Coord(i, j));

            // chan_leng is the length of the mouse's current travels!
            bthis.cells[i][j].m_chanLen = pathlen;
        }

        if (previ >= 0 && prevj >= 0)
            console.log("Chan: From: i,j: " + previ.toFixed(0) + " " + prevj.toFixed(0) +
                " To i,j: " + i.toFixed(0) + " " + j.toFixed(0) + " To elev: " + bthis.cells[i][j].m_chanElev.toFixed(3) );
    }
};


