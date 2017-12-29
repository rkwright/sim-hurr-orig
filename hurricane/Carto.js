/*
 * Cartographic projection Utilities.  Very simplistic at this point,
 * really supports only a purely spherical earth.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 */

/**
 * Constants
 */
var Carto = {
    revision: 'r01',
    METERPERDEG: 111195.0,  // based on circumference at equator, https://solarsystem.nasa.gov/planets/earth/facts
    EARTH_DIAMETER: 12742.0 // per NASA
};

/**
 * Simple pseudo sub-class
 * @param dist
 * @param theta
 * @constructor
 */
Carto.PolarCoord = function( dist, theta ) {

    this.dist = dist;
    this.theta = theta;
};

/**
 * Simple 2D coord - use three.js?
 * @param x
 * @param y
 * @constructor
 */
Carto.Coord2 = function (x, y) {
    this.x = x;
    this.y = y;
};

/**
 * Simple 3D coord - use three.js?
 * @param x
 * @param y
 * @param z
 * @constructor
 */
Carto.Coord3 = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

/**
 * Pseudo constructor
 * @constructor
 */
Carto.Carto = function () {

};

Carto.prototype = {

    transform: function (lat, lon, elev ) {
        var radius = Carto.EARTH_DIAMETER;

        // this trasform from https://stackoverflow.com/questions/28365948/javascript-\
        // latitude-longitude-to-xyz-position-on-earth-threejs
        var phi   = Math.PI/2 - lat;
        var theta = Math.PI + lon;
        x = -(radius * Math.sin(phi) * Math.cos(theta));
        z = (radius * Math.sin(phi) * Math.sin(theta));
        y = (radius * Math.cos(phi));

        return new Carto.Coord3(x,y,z);
    },

    /**
     * Routine to convert the cartesian coordinates (x1,y1) - with origin
     *	(x0,y0) - to Polar coordinates. The angle theta is returned in the
     *	range 0 to 2 PI measured clockwise from the y axis (North).
     *
     * @param x0    origin
     * @param y0
     * @param x1    current point
     * @param y1
     *
     * @return polar -  radial distance
     *                  theta - angle CW from north (in radians)
     */
    cartesianToPolarNorth: function ( x0, y0, x1, y1 ) {
        var polar = new HurrModel.PolarCoord(0,0);

        polar.dist  = this.degreesToMeters( x0, y0, x1, y1 );
        polar.theta = this.findHeading( x0, y0, x1, y1 );

        return polar;
    },
    /**
     * Given two coordinates in degrees, find the headingfrom the first to the
     * second by the shortest great circle distance
     * location
     *
     * Parameters:   lat0,lon0  - in degrees
     * lat1,lon1  - in degrees
     *
     * Return:			heading in degrees where N = 0, NW = 45 and so on
     *
     */

    findHeading: function ( lon1Deg, lat1Deg, lon2Deg, lat2Deg ) {
        var	lat1,lon1;
        var	lat2,lon2;
        var	heading;
        var	headingDeg;

        lon1Deg = WrapLimit( lon1Deg, -180.0, 180.0, 360.0 );
        lat1Deg = WrapLimit( lat1Deg, -90.0, 90.0, 180.0 );
        lon2Deg = WrapLimit( lon2Deg, -180.0, 180.0, 360.0 );
        lat2Deg = WrapLimit( lat2Deg, -90.0, 90.0, 180.0 );

        // convert it all to radians
        lat2    = toRadians(lat2Deg);
        lon2    = toRadians(lon2Deg);
        lat1    = toRadians(lat1Deg);
        lon1    = toRadians(lon1Deg);

        heading = fmod( Math.atan2( Math.sin(lon1 - lon2) * Math.cos(lat2),
            Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)), Math.PI*2);

        headingDeg = toDegrees( heading );

        return headingDeg;
    },

    degreesToMeters: function ( lon1Deg, lat1Deg, lon2Deg, lat2Deg ) {
        if ( lat1Deg === lat2Deg && lon1Deg === lon2Deg )
            return 0.0;

        lon1Deg = WrapLimit( lon1Deg, -180.0, 180.0, 360.0 );
        lat1Deg = WrapLimit( lat1Deg, -90.0, 90.0, 180.0 );
        lon2Deg = WrapLimit( lon2Deg, -180.0, 180.0, 360.0 );
        lat2Deg = WrapLimit( lat2Deg, -90.0, 90.0, 180.0 );

        var	lat1 = toRadians( lat1Deg );
        var	lon1 = toRadians( lon1Deg );
        var	lat2 = toRadians( lat2Deg );
        var	lon2 = toRadians( lon2Deg );

        var	distRad = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1-lon2));

        return DEG_TO_METERS( toDegrees(distRad) );
    },

    /**
     *   Given a coordinate, heading and distance travelled, finds the new coordinates
     *   Parameters:   lat,lon  - in degrees
     *				  heading  - in degrees, where 0 is north, 45 NW, and so on
     *				  distance - in meters
     *			  newLat, newLon - resulting coordinate, in degrees
     */

    metersToDegrees: function ( lonDeg,	latDeg,	heading, dist )  {

        var	lat,lon;
        var	newLat,newLon;
        var	dLon;
        var	distRad;

        lonDeg = WrapLimit( lonDeg, -180.0, 180.0, 360.0 );
        latDeg = WrapLimit( latDeg, -90.0, 90.0, 180.0 );

        // convert it all to radians
        lat = toRadians(latDeg);
        lon = toRadians(lonDeg);

        // note that this is calculated as a function of a nautical circumference where the ratio of
        // nautical mile to statute mile is (5280.0/6076.1149), which is based on the average of the
        // major and minor axes of WGS80
        distRad = toRadians( METERS_TO_DEG(dist) );
        heading = toRadians(heading);

        newLat = asin( sin(lat) * cos(distRad) + cos(lat) * sin(distRad) * cos(heading) );
        dLon   = atan2( sin(heading) * sin(distRad) * cos(lat), cos(distRad) - sin(lat) * sin(newLat) );
        newLon = fmod( lon - dLon + PI, TWO_PI ) - PI;

        newLatDeg = toDegrees(newLat);
        newLonDeg = toDegrees(newLon);

        newLonDeg = WrapLimit( newLonDeg, -180.0, 180.0, 360.0 );
        newLatDeg = WrapLimit( newLatDeg, -90.0, 90.0, 180.0 );

        /*
            // just a check to make sure we got the right value
            double newDist = acos( sin(lat) * sin(newLat) + cos(lat) * cos(newLat) * cos(lon-newLon) );
            newDist = DEG_TO_METERS(RAD2DEG(newDist));
            ASSERT(fabs(newDist-dist) < 100.0);
        */
    },

    /**
     * Simple utils
     */
    toDegrees: function (angle) {
        return angle * (180 / Math.PI);
    },

    toRadians: function (angle) {
        return angle * (Math.PI / 180);
    },

    clamp: function (cv, lo, hi) {
        return ((cv > hi) ? hi : ((cv < lo) ? lo : cv));
    },

    hypot: function (x, y) {
        return Math.sqrt(x * x + y * y);
    },

    roundInt: function (a) {

        return (a < 0) ? Math.round(a - 0.5) : Math.round(a + 0.5);
    },

    metersToDeg: function (m) {
        return m / Carto.METERPERDEG;
    },

    degToMeters: function (d) {
        return d * Carto.METERPERDEG;
    },

    // AZIM2MATHR(azim) ((PI+HALF_PI)-azim)
    azimuthToRadians: function ( azim ) {
        return (Math.PI * 1.5) - azim;
    },

    // AZIM2MATHD(azim) ((450.0)-azim)
    azimuthToDegrees: function ( azim ) {
        return 450.0 - azimuth;
    }



};
