/*
 * Hurricane Plot setup.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

'use strict';
var HurrPlot = (function () {

    // Constructor
    function HurrPlot( gfxScene ) {
        this.gfxScene = gfxScene;
        this.saffirMat = [];
        this.createSaffirMat();

        window.plotObj = this;
    }

    HurrPlot.prototype = {

        // Constants
        REVISION: '1.0',

        /**
         * Create the sphere mesh and wrap it with the image
         */
        createGlobe: function () {
            var globe = new THREE.SphereGeometry(2, 32, 32);

            var textureLoader = new THREE.TextureLoader();
            var bumpLoader = new THREE.TextureLoader();
            var mat = new THREE.MeshPhongMaterial({color: '#ffffff', transparent: true, opacity: 0.75});
            textureLoader.load("images/8081-earthmap8k.jpg", function (texture) {
                mat.map = texture;
                mat.needsUpdate = true;
                textureLoader.load("images/8081-earthbump8k.jpg", function (bump) {
                    mat.bumpMap = bump;
                    mat.bumpScale = 0.05;


                    var mesh = new THREE.Mesh(globe, mat);
                    gfxScene.add(mesh);
                });
            });

        },

        createSaffirMat: function () {
            var storm = new StormData();
            for (var i = 0; i < storm.SAFFIR.length; i++) {
                this.saffirMat[i] = new THREE.MeshLambertMaterial({color: storm.SAFFIR[i].color});
            }
        },

        /**
         * Plot the current storm track by fetching the set of positions and creating
         * great-circle arcs for each and creating a curve in threee.js for them.
         *
         * The procedure is:
         * - iterate over the storm track entries
         * - for each pair of points
         * - calculate the great circle arc, which returns an array of lat/lon [n][2]
         * - generate the transform of that array into scaled 3D-space as an array of Vector3
         * - generate a CatMullCurve using three.js
         * - generate a tube geometry using that curve, returns the resulting geometry
         */
        plotStormTrack: function ( curStorm ) {
            var gcGen = new GreatCircle();
            var points;
            var startLL = {lat: curStorm.entries[0][STORMDATA.LAT], lon: curStorm.entries[0][STORMDATA.LON]};
            var endLL = {};
            var scale = 2 / CARTO.EARTH_DIAMETER;
            var xyz;
            var plot = window.plotObj;

            var saffirCat = stormData.getSaffirCat(curStorm.entries[0][STORMDATA.MAXWIND]);
            var mat = plot.saffirMat[saffirCat];

            plot.roundJoin(startLL.lat, startLL.lon, scale, mat);

            console.log(" LL: " + startLL.lat + ", " + startLL.lon);

            for (var i = 1; i < curStorm.entries.length; i++) {
                endLL = {lat: curStorm.entries[i][STORMDATA.LAT], lon: curStorm.entries[i][STORMDATA.LON]};

                saffirCat = stormData.getSaffirCat(curStorm.entries[i][STORMDATA.MAXWIND]);
                mat = plot.saffirMat[saffirCat];

                plot.roundJoin(endLL.lat, endLL.lon, scale, mat);

                console.log(" LL: " + endLL.lat + ", " + endLL.lon);

                points = gcGen.generateArc(startLL, endLL, 10, {offset: 10});

                var pts = points[0];
                var track = [];

                for (var j = 0; j < pts.length; j++) {
                    xyz = carto.latLonToXYZ(pts[j][1], pts[j][0], CARTO.EARTH_DIAMETER, scale);
                    track.push(xyz);
                    console.log("xyz: " + xyz.x.toFixed(2) + " " + xyz.y.toFixed(2) + " " + xyz.z.toFixed(2));
                }

                var curve = new THREE.CatmullRomCurve3(track);
                var geometry = new THREE.TubeGeometry(curve, track.length, TRACK_DIA, 32, false);

                var arcMesh = new THREE.Mesh(geometry, mat);
                plot.gfxScene.add(arcMesh);

                startLL = endLL;
            }
        },

        /**
         * Create a sphere to form the "round join" between sections of the track
         */
        roundJoin: function (lat, lon, scale, mat) {
            var join = new THREE.SphereGeometry(TRACK_DIA, 32, 32);

            var xyz = carto.latLonToXYZ(lat, lon, CARTO.EARTH_DIAMETER, scale);

            var mesh = new THREE.Mesh(join, mat);
            mesh.position.set(xyz.x, xyz.y, xyz.z);
            gfxScene.add(mesh);
        },

        /**
         * Called by the hurricane model to have the sample data rendered
         * In this case, the wind arrows and eye are already in existence
         * so we just update the location of the eye and set the direction
         * and scale of the arrows
         */
        renderHurricane: function (eyex, eyeY, sampleData) {

        }
    };

    return HurrPlot;
})();