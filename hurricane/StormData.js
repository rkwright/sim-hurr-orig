/*
 * Storm Data.  The object repre for a single storm for the hurricane modelling
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

var STORMDATA = {
    revision: "1.0",

    // contents of the entry fields
    YEAR:     0,
    MONTH:    1,
    DAY:      2,
    TIME:     3,    // an integer in 24 hour format, e.g. 600, 1200, etc.
    EVENT:    4,    // e.g. landfall, etc.  Usually blank
    STATUS:   5,    // e.g. HU, TS, etc.
    LAT:      6,    // in degrees with sign
    LON:      7,    // in degrees with sign
    MAXWIND:  8,    // in knots
    MINPRESS: 9,    // in mb

    MISSING:  -999
};

/**
 * @constructor
 */
StormData = function () {

    this.atcID   = undefined;
    this.name    = undefined;
    this.entries = [];
};
