/*
 * Time Spline.  Parametrizes the application of a spline to a time-series
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

var TimeSpline = (function () {

    /**
     * @constructor
     */
    TimeSpline = function () {

        this.timeIntcp = 0;
        this.timeSlope = 1;
        this.spline = [];
    };

    TimeSpline.prototype = {

    };

    return TimeSpline;
})();
