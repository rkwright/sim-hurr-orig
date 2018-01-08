/*
 * Storm Data for a single storm for the hurricane modelling
 *
 * This is the data for a single storm, comprising the metadata and all the
 * entries.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

var StormData= {
    revision: "1.0"
};

/**
 * @constructor
 */
StormData.StormData = function () {

    this.atcID   = undefined;
    this.name    = undefined;
    this.entries = [];
};
