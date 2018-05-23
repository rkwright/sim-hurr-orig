/*
 * Storm Data.  The object represents a single storm for the hurricane modelling
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

var StormData = (function () {

    /**
     * @constructor
     */
    StormData = function () {

        this.atcID = undefined;
        this.name = undefined;
        this.entries = [];
    };

    // ----- Constants ------

    StormData.WOWSER = 1.245;

    StormData.REVISION = "1.1";

    StormData.SAFFIR =  [
            {cat: '5', minMPH: 157, color: 0xff6060},
            {cat: '4', minMPH: 130, color: 0xff8f20},
            {cat: '3', minMPH: 111, color: 0xffc140},
            {cat: '2', minMPH: 96, color: 0xffe775},
            {cat: '1', minMPH: 74, color: 0xffffcc},
            {cat: 'TS', minMPH: 39, color: 0x01faf4},
            {cat: 'TD', minMPH: 33, color: 0x5dbaff}
        ];

        // contents of the entry fields
    StormData.YEAR     = 0;
    StormData.MONTH    = 1;
    StormData.DAY      = 2;
    StormData.TIME     = 3;    // an integer in 24 hour format, e.g. 600, 1200, etc.
    StormData.EVENT    = 4;    // e.g. landfall, etc.  Usually blank
    StormData.STATUS   = 5;    // e.g. HU, TS, etc.
    StormData.LAT      = 6;    // in degrees with sign
    StormData.LON      = 7;    // in degrees with sign
    StormData.MAXWIND  = 8;    // in knots
    StormData.MINPRESS = 9;   // in mb

    StormData.MISSING  = -999;

    StormData.prototype = {

        /**
         * Return the Saffir-Simpson category for the specified windspeed, in MPH
         * @param windSpeed
         * @returns {*}
         */
        getSaffirCat: function (windSpeed) {
            for (var i = 0; i < this.SAFFIR.length - 1; i++) {
                if (windSpeed >= this.SAFFIR[i].minMPH)
                    break;
            }

            return i;
        }
    };

    return StormData;
})();