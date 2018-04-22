/*
 * Hurricane Gui setup.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

'use strict';
var HurrGui = (function () {

    // Constructor
    function HurrGui( gui, stormFile, updateCallback, runCallback ) {
        this.gui = gui;
        this.stormFile = stormFile;
        this.updateCallback = updateCallback;
        this.runCallback = runCallback;

        this.stormOptions = {};
        this.curStorm = undefined;
        this.storms = undefined;

        this.parmOptions = {};

        this.stormsGui = undefined;
        this.parmsGui  = undefined;

        window.gThis = this;
    }

    HurrGui.prototype = {

        // Constants
        REVISION: '1.0',

        /**
         * Update the existing controller for storms and create a new one.
         * Have to do it this way as there appears to be no easy way to
         * "refresh" the data in a controller
         */
        updateStorms: function (year) {

            if (this.updateStorms.gui !== undefined)
                this.stormsGui.remove(this.updateStorms.gui);

            this.storms = this.stormFile.getStormsForYear(Number(year));
            this.curStorm = this.storms[0];
            this.stormLabels = this.stormFile.getStormLabels(this.storms);
            this.stormOptions.stormLabels = this.stormLabels[0];

            this.updateStorms.gui = this.stormsGui.add(this.stormOptions, "stormLabels", this.stormLabels).name("Storms");
            this.updateStorms.gui.onChange(this.stormsChange);
        },

        /**
         * Handle the change event for the storms controller
         */
        stormsChange: function () {
            var gThis = window.gThis;
            var index = gThis.stormLabels.indexOf( gThis.stormOptions.stormLabels );
            gThis.curStorm = gThis.storms[index];
            gThis.updateEntries( gThis.curStorm );
            gThis.updateButton();
            //gThis.updateCallback( gThis.curStorm );
        },

        /**
         * Update existing controller for the entries and create a new one
         */
        updateEntries: function (storm) {
            if (this.updateEntries.gui !== undefined)
                this.stormsGui.remove(this.updateEntries.gui);

            this.entryLabels = stormFile.getEntryLabels(storm);
            this.stormOptions.entryLabels = this.entryLabels[0];

            this.updateEntries.gui = this.stormsGui.add(this.stormOptions, "entryLabels", this.entryLabels).name("Entries");
            this.updateEntries.gui.onChange(this.entriesChange);
        },

        /**
         * Handle the change event for the entries controller.  Not used yet.
         */
        entriesChange: function () {
            var gThis = window.gThis;
            var index = gThis.entryLabels.indexOf( gThis.stormOptions.entryLabels );
        },

        /**
         * Handle change in the year combo-box
         */
        yearChange: function () {
            console.log("Changed year");

            var gThis = window.gThis;
            gThis.updateStorms(gThis.stormOptions.year);
            gThis.updateEntries(gThis.storms[0]);
            gThis.updateButton();
        },

        /**
         * Remove and renew the update "button"
         */
        updateButton: function() {
           if (this.updateButton.gui !== undefined)
               this.stormsGui.remove(this.updateButton.gui);

           this.updateButton.gui = this.stormsGui.add(this.stormOptions, 'update');
          this.stormOptions.update = function () {
              window.gThis.updateCallback( window.gThis.curStorm );
          };
        },

        /**
         * Set up the datgui controls on the basis of the loaded storm data
         */
        setupStormsGui: function () {
            this.stormsGui = this.gui.addFolder("Storms");

            this.years = this.stormFile.getYears();
            this.storms = this.stormFile.getStormsForYear(this.years[0]);
            this.curStorm = this.storms[0];
            this.stormLabels = this.stormFile.getStormLabels(this.storms);
            this.entryLabels = this.stormFile.getEntryLabels(this.storms[0]);

            this.stormOptions.year = this.years[0];
            this.stormOptions.stormLabels = this.stormLabels[0];
            this.stormOptions.entryLabels = this.entryLabels[0];
            this.stormOptions.update = function () {
                window.gThis.updateCallback( window.gThis.curStorm );
            };

            var gui_year = this.stormsGui.add(this.stormOptions, "year", this.years).name("Year").onChange(this.yearChange);

            this.updateStorms(this.stormOptions.year);

            this.updateEntries(this.curStorm);

            this.updateButton();

            this.stormsGui.open();
        },

        /**
         * Remove and renew the update "button"
         */
        runButton: function() {
            if (this.runButton.gui !== undefined)
                this.parmsGui.remove(this.runButton.gui);

            this.runButton.gui = this.parmsGui.add(this.parmOptions, 'run');
            this.parmOptions.run = function () {
                window.gThis.runCallback( window.gThis.curStorm );
            };
        },
        /**
         * Set up the datgui controls on the basis of the loaded storm data
         */
        setupParmsGui: function () {
            this.parmsGui = this.gui.addFolder("Parms");

            this.parmOptions.run = function () {
                window.gThis.runCallback( window.gThis.curStorm );
            };

            this.runButton();

            this.parmsGui.open();
        },

        setupDatGui: function () {

            this.setupStormsGui();
            this.setupParmsGui();
        }


    };

    return HurrGui;
})();