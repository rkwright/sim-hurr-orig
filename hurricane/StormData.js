/*
 * Storm Data.  The object repre for a single storm for the hurricane modelling
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

var STORMDATA = {
    revision: "1.1",

    SAFFIR : [
        { cat: '5',  minMPH: 157, color: 0xff6060 },
        { cat: '4',  minMPH: 130, color: 0xff8f20 },
        { cat: '3',  minMPH: 111, color: 0xffc140 },
        { cat: '2',  minMPH: 96,  color: 0xffe775 },
        { cat: '1',  minMPH: 74,  color: 0xffffcc },
        { cat: 'TS', minMPH: 39,  color: 0x01faf4 },
        { cat: 'TD', minMPH: 33,  color: 0x5dbaff }
    ],

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

StormData.prototype = {

    /**
     * Return the Saffir-Simpson category for the specified windspeed, in MPH
     * @param windSpeed
     * @returns {*}
     */
    getSaffirCat: function (windSpeed) {
        for (var i = 0; i < STORMDATA.SAFFIR.length - 1; i++) {
            if (windSpeed >= STORMDATA.SAFFIR[i].minMPH)
                break;
        }

        return i;
    }
};