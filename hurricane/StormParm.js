/*
 * Storm parameters for the hurricane modelling
 *
 * Original Fortran (!) code by Michael Drayton.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */

var StormParm = {
    revision: "r01"
};

/**
 * Pseudo constructor
 * @constructor
 */
StormParm.StormParm = function () {
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
