/*
 * Hurricane Plot setup.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

'use strict';
class HurrPlot  {

    // Constants
    static REVISION = '1.0';

    // Constructor
    constructor( gfxScene ) {
        this.gfxScene = gfxScene;
        this.saffirMat = [];
        this.createSaffirMat();

        this.earthMesh;

        window.plotObj = this;
    }

    // class methods
    /**
     * Create the sphere mesh and wrap it with the image
     */
    createGlobe () {
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

                window.plotObj.earthMesh = new THREE.Mesh(globe, mat);
                gfxScene.add(window.plotObj.earthMesh);
            });
        });
    }

    /**
     *
     */
    createSaffirMat () {
        var storm = new StormData();
        for (var i = 0; i < StormData.SAFFIR.length; i++) {
            this.saffirMat[i] = new THREE.MeshLambertMaterial({color: StormData.SAFFIR[i].color});
        }
    }

}