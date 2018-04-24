/*
 * Storm-data loading facilities.  This is based on loading the JSON file derived from the
 * hurrdat2 data file as documented in www.nhc.noaa.gov/data/hurdat/hurdat2-format-atlantic.pdf
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 */

'use strict';

//var StormFile = (function () {

    // constructor
    function StormFile() {
        this.stormFile = undefined;
        this.jsonData = undefined;
        this.prune = false;

        window.stormThis = this;
    }

    StormFile.prototype = {

        // Constants
        REVISION: '1.0',


        loadJSON: function (callback) {

            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', this.stormFile, true);
            xobj.onreadystatechange = function () {
                if (xobj.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                    console.log(xobj.getAllResponseHeaders());
                }

                if (xobj.readyState === XMLHttpRequest.DONE && xobj.status === HttpStatus.OK) {
                    // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                    callback(xobj.responseText);
                }
            };
            xobj.send(null);
        },

        /**
         * Load the data from the specified JSON file, then parse the resulting payload
         * @param stormFile
         * @param stormReady
         * @param prune
         */
        loadData: function (stormFile, stormReady, prune) {

            this.stormFile = stormFile;
            this.stormReady = stormReady;
            this.prune = prune;
            this.loadJSON(function (response) {
                // Parse JSON string into object
                try {
                    stormThis.jsonData = JSON.parse(response);

                    if (stormThis.prune === true)
                        stormThis.pruneMissing();

                    stormThis.stormReady( stormThis );

                } catch (e) {
                    if (e instanceof SyntaxError) {
                        console.error(e, true);
                    } else {
                        console.error(e, false);
                    }
                }

            });
        },

        /**
         * Getter for the JSON data
         * @returns {*}
         */
        getJSON: function () {
            return this.jsonData;
        },

        /**
         * Walk through the JSON data and for each storm, remove any storm with 3
         * or more consecutive entries with MISSING data. For storms with missing data (<3)
         * interpolate the missing data.
         */
        pruneMissing: function () {
            var i = 0;
            var k = 0;

            while (i < this.jsonData.storms.length) {
                var storm = this.jsonData.storms[i++];

                k = 0;
                for ( var n = 0; n < storm.entries.length; n++ ) {
                    var tr = storm.entries[n];
                    if (storm.entries[n].includes(-999)) {
                        k++;
                    }
                }
                storm.pc = (storm.entries.length - k)/ storm.entries.length * 100;
                if (storm.pc < 50) {
                    //console.log(storm.entries[0][0] + " " + storm.atcID + " " + storm.name + " " + storm.pc + "% missing");
                    this.interpMissingPoints( storm, storm.pc );
                }
                //else
                    //console.error( "------- BAD ------ " +  storm.entries[0][0] + " " + storm.atcID + " " + storm.name + " " + storm.pc + "% missing");

            }
        },

        /**
         * Searches the current JSON data-file and returns an array of all the years
         * with storm data. Years are 4-digit Numbers.
         */
        getYears: function () {
            var results = [];
            var storm;
            var lastYear = undefined;

            for (var index = 0; index < this.jsonData.storms.length; index++) {
                storm = this.jsonData.storms[index];
                if (storm && storm.entries[0][0] !== lastYear) {
                    results.push(storm.entries[0][0]);
                    lastYear = storm.entries[0][0];
                }
            }

            return results;
        },

        /**
         * Walk through the storm and, if some are missing, use spline
         * interpolation to replace their values.
         * @param storm
         * @constructor
         */
        interpMissingPoints: function( storm, pc ) {
            console.log("Storm: " + storm.atcID);
        },

        /**
         * Searches the currrent JSON data file and returns an array of the storms that occurred
         * during the specified year. Storms are returned as an array of StormData objects.
         * @param year
         */
        getStormsForYear: function (year) {
            var results = [];
            var storm;

            for (var index = 0; index < this.jsonData.storms.length; index++) {
                storm = this.jsonData.storms[index];
                if (storm && storm.entries[0][0] === year) {
                    results.push(storm);
                }
            }

            return results;
        },

        /**
         * For each storm, fetch the ATCID and Name, concatenate them and add
         * them to the array
         *
         * @param storms
         * @returns {Array}
         */
        getStormLabels: function (storms) {
            var results = [];
            var storm;
            var mois = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            for (var index = 0; index < storms.length; index++) {
                storm = storms[index];
                var entry = storm.entries[0];
                var start = mois[entry[1]] + " " + entry[2];
                if (storm) {
                    var label = storm.atcID + " : " + storm.name + " : " + start;
                    results.push(label);
                }
            }

            return results;
        },

        /**
         * Construct an array of strings which comprises the data in each entry
         * @param storm
         * @returns {Array}
         */
        getEntryLabels: function (storm) {
            var results = [];
            var entry;
            var label;

            for (var index = 0; index < storm.entries.length; index++) {
                entry = storm.entries[index];
                if (entry) {
                    label = entry[2] + " " + this.pad("0000", entry[3], true).substring(0, 2) + "h " + entry[6].toFixed(1) + " " +
                        entry[7].toFixed(1) + " " + entry[8].toFixed(0) + " " + entry[9].toFixed(0);

                    results.push(label);
                }
            }

            return results;
        },

        /**
         * Pad a string with specified chars, left or right
         * For example, to zero pad a number to a length of 10 digits,
         *     pad('0000000000',123,true);  ->   "0000000123"
         *
         * @param pad       the string to fill
         * @param str       the string to be padded
         * @param padLeft   padding on the left or right
         * @returns {*}
         */
        pad: function (pad, str, padLeft) {
            if (typeof str === 'undefined')
                return pad;
            if (padLeft) {
                return (pad + str).slice(-pad.length);
            } else {
                return (str + pad).substring(0, pad.length);
            }
        }
    };

//        return StormFile;
//})();