/**
 * Cloned from https://github.com/springmeyer/arc.js/
 *
 * Ported to three.js and gfx by rkwright, January 2018
 */

'use strict';

/**
 * http://en.wikipedia.org/wiki/Great-circle_distance
 *
 * @param start, in degrees
 * @param end, in degrees
 * @param properties
 * @constructor
 */
GreatCircle.GreatCircle = function( start, end, properties ) {
    if (!start || start.lon === undefined || start.lat === undefined) {
        throw new Error("GreatCircle constructor expects two args: start and end objects with x and y properties");
    }
    if (!end || end.lon === undefined || end.lat === undefined) {
        throw new Error("GreatCircle constructor expects two args: start and end objects with x and y properties");
    }

    //this.start = new Coord(start.x,start.y);
    this.startLon = Math.toRad(start.lon);
    this.startLat = Math.toRad(start.lat);
    
    //this.end = new Coord(end.x,end.y);
    this.endLon = Math.toRad(end.lon);
    this.endLat = Math.toRad(end.lat);
    
    this.properties = properties || {};

    var w = this.startLon - this.endLon;
    var h = this.startLat - this.endLat;
    var z = Math.sqr(Math.sin(h / 2.0)) + Math.cos(this.startLat) * Math.cos(this.endLat) * Math.sqr(Math.sin(w / 2.0));
    this.g = 2.0 * Math.asin(Math.sqrt(z));

    if (this.g === Math.PI) {
        throw new Error('it appears ' + start.view() + ' and ' + end.view() + " are 'antipodal', e.g diametrically opposite, thus there is no single route but rather infinite");
    } else if (isNaN(this.g)) {
        throw new Error('could not calculate great circle between ' + start + ' and ' + end);
    }
};

/*
 * http://williams.best.vwh.net/avform.htm#Intermediate
 */
GreatCircle.GreatCircle.prototype = {

    interpolate: function(f) {
        var A = Math.sin((1 - f) * this.g) / Math.sin(this.g);
        var B = Math.sin(f * this.g) / Math.sin(this.g);
        var x = A * Math.cos(this.startLat) * Math.cos(this.startLon) + B * Math.cos(this.endLat) * Math.cos(this.endLon);
        var y = A * Math.cos(this.startLat) * Math.sin(this.startLon) + B * Math.cos(this.endLat) * Math.sin(this.endLon);
        var z = A * Math.sin(this.startLat) + B * Math.sin(this.endLat);
        var lat = R2D * Math.atan2(z, Math.sqrt(Math.sqr(x) + Math.sqr(y)));
        var lon = R2D * Math.atan2(y, x);
        return [lon, lat];
    },

    /*
     * Generate points along the great circle
     */
    generateArc: function(npoints,options) {
        var first_pass = [];
        if (!npoints || npoints <= 2) {
            first_pass.push([this.start.lon, this.start.lat]);
            first_pass.push([this.end.lon, this.end.lat]);
        } else {
            var delta = 1.0 / (npoints - 1);
            for (var i = 0; i < npoints; ++i) {
                var step = delta * i;
                var pair = this.interpolate(step);
                first_pass.push(pair);
            }
        }

        /* partial port of dateline handling from: gdal/ogr/ogrgeometryfactory.cpp
          TODO - does not handle all wrapping scenarios yet
        */
        var bHasBigDiff = false;
        var dfMaxSmallDiffLong = 0;
        // from http://www.gdal.org/ogr2ogr.html
        // -datelineoffset:
        // (starting with GDAL 1.10) offset from dateline in degrees (default long. = +/- 10deg, geometries within 170deg to -170deg will be splited)
        var dfDateLineOffset = options && options.offset ? options.offset : 10;
        var dfLeftBorderX = 180 - dfDateLineOffset;
        var dfRightBorderX = -180 + dfDateLineOffset;
        var dfDiffSpace = 360 - dfDateLineOffset;

        // https://github.com/OSGeo/gdal/blob/7bfb9c452a59aac958bff0c8386b891edf8154ca/gdal/ogr/ogrgeometryfactory.cpp#L2342
        for (var j = 1; j < first_pass.length; ++j) {
            var dfPrevX = first_pass[j - 1][0];
            var dfX = first_pass[j][0];
            var dfDiffLong = Math.abs(dfX - dfPrevX);
            if (dfDiffLong > dfDiffSpace &&
                ((dfX > dfLeftBorderX && dfPrevX < dfRightBorderX) || (dfPrevX > dfLeftBorderX && dfX < dfRightBorderX))) {
                bHasBigDiff = true;
            } else if (dfDiffLong > dfMaxSmallDiffLong) {
                dfMaxSmallDiffLong = dfDiffLong;
            }
        }

        var poMulti = [];
        if (bHasBigDiff && dfMaxSmallDiffLong < dfDateLineOffset) {
            var poNewLS = [];
            poMulti.push(poNewLS);
            for (var k = 0; k < first_pass.length; ++k) {
                var dfX0 = parseFloat(first_pass[k][0]);
                if (k > 0 && Math.abs(dfX0 - first_pass[k - 1][0]) > dfDiffSpace) {
                    var dfX1 = parseFloat(first_pass[k - 1][0]);
                    var dfY1 = parseFloat(first_pass[k - 1][1]);
                    var dfX2 = parseFloat(first_pass[k][0]);
                    var dfY2 = parseFloat(first_pass[k][1]);
                    if (dfX1 > -180 && dfX1 < dfRightBorderX && dfX2 === 180 &&
                        k + 1 < first_pass.length &&
                        first_pass[k - 1][0] > -180 && first_pass[k - 1][0] < dfRightBorderX) {
                        poNewLS.push([-180, first_pass[k][1]]);
                        k++;
                        poNewLS.push([first_pass[k][0], first_pass[k][1]]);
                        continue;
                    } else if (dfX1 > dfLeftBorderX && dfX1 < 180 && dfX2 === -180 &&
                        k + 1 < first_pass.length &&
                        first_pass[k - 1][0] > dfLeftBorderX && first_pass[k - 1][0] < 180) {
                        poNewLS.push([180, first_pass[k][1]]);
                        k++;
                        poNewLS.push([first_pass[k][0], first_pass[k][1]]);
                        continue;
                    }

                    if (dfX1 < dfRightBorderX && dfX2 > dfLeftBorderX) {
                        // swap dfX1, dfX2
                        var tmpX = dfX1;
                        dfX1 = dfX2;
                        dfX2 = tmpX;
                        // swap dfY1, dfY2
                        var tmpY = dfY1;
                        dfY1 = dfY2;
                        dfY2 = tmpY;
                    }
                    if (dfX1 > dfLeftBorderX && dfX2 < dfRightBorderX) {
                        dfX2 += 360;
                    }

                    if (dfX1 <= 180 && dfX2 >= 180 && dfX1 < dfX2) {
                        var dfRatio = (180 - dfX1) / (dfX2 - dfX1);
                        var dfY = dfRatio * dfY2 + (1 - dfRatio) * dfY1;
                        poNewLS.push([first_pass[k - 1][0] > dfLeftBorderX ? 180 : -180, dfY]);
                        poNewLS = [];
                        poNewLS.push([first_pass[k - 1][0] > dfLeftBorderX ? -180 : 180, dfY]);
                        poMulti.push(poNewLS);
                    }
                    else {
                        poNewLS = [];
                        poMulti.push(poNewLS);
                    }
                    poNewLS.push([dfX0, first_pass[k][1]]);
                } else {
                    poNewLS.push([first_pass[k][0], first_pass[k][1]]);
                }
            }
        }
        else {
            // add normally
            var poNewLS0 = [];
            poMulti.push(poNewLS0);
            for (var l = 0; l < first_pass.length; ++l) {
                poNewLS0.push([first_pass[l][0], first_pass[l][1]]);
            }
        }

        return poMulti;
    }
};
