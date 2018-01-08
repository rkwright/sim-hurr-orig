/*
 * Storm-data loading facilities
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 */

/**
 * Constants
 */
var StormData = {
    revision: '1.0'
};

/**
 * @constructor
 */
StormData.StormData = function () {
    this.stormFile = undefined;
    this.jsonData  = undefined;

    stThis = this;
};

StormData.StormData.prototype = {

    loadJSON: function(callback) {

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
     * Load the data from the specified JSON file, then parse the
     * resuling payload
     * @param stormFile
     * @param stormReady
     */
    loadData: function( stormFile, stormReady ) {

        this.stormFile = stormFile;
        this.stormReady = stormReady;
        this.loadJSON(function(response) {
            // Parse JSON string into object
            this.jsonData = JSON.parse(response);
            stThis.stormReady();
        });
    },

    /**
     * Getter for the JSON data
     * @returns {*}
     */
    getJSON:  function () {
        return this.jsonData;
    }
};