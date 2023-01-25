/*
 * Storm parameters for the hurricane modelling
 *
 * These are the time-node state parameters that are read from the storm file.
 * They are effectively the inputs for each time step.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */

var STORMPARM = {
    revision: "1.0"
};

/**
 * @constructor
 */
StormParm = function () {
	this.x = 0;
	this.y = 0;
	this.pressure = 0;
	this.fwdVelocity = 0;
	this.heading = 0;
	this.windspeed = 0;
	this.day = 0;
	this.month = 0;
	this.year = 0;
	this.julianDay = 0;
	this.hour = 0;
};
