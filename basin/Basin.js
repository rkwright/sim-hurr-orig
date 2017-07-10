/*
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */

var BASIN = {
            revision: 'r01',
};

BASIN.GeoCell = function () {

    this.order     = 0;		// stream order of this cell
    this.area      = 0;     // catchment area, in unit cells
    this.chanLen   = 0;     // channel length below this cell
    this.exit      = 0;     // side on which stream exits cell
    this.elev      = 0;     // elevation of outlet itself
    this.chanElev  = 0;     // elev of channel, in maze units
    this.chanSlope = 0;		// slope of chanel, in maze units
};

/**
 * Initialize the parameters that control the maze-building
 * process.
 *
 * @param maze - the maze representing the catchment
 */
BASIN.Basin = function ( maze ) {

    this.maze = maze;

    this.basin = [];
};

BASIN.Basin.prototype = {

    build: function () {

        var Coords = function(x, y) {
            return {
                "x" : x,
                "y" : y
            };
        };

        for ( var i = 0; i < this.maze.row; i++ ) {

            basin[i] = [];

            for ( var j = 0; j < this.maze.col; j++ ) {

                basin[i][j] = new BASIN.GeoCell();
            }
        }
    }
};


