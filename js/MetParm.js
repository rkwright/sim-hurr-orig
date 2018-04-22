/*
 * Meteorological parameters for the hurricane modelling
 *
 * Original Fortran (!) code by Michael Drayton.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 */

var METPARM = {
    revision: "1.0"
};

/**
 * @constructor
 */
MetParm = function () {

	this.yVel = 0;
	this.xVel = 0;
	this.yVelMax = 0;
	this.xVelMax = 0;
	this.velocity = 0;
	this.maxVelocity = 0;
	this.pressure = 0;
	this.minPressure = 0;
};
