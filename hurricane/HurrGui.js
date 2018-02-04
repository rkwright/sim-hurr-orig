/*
 * Hurricane Gui setup.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 *
 */

var HURRGUI = {
    revision: '1.0'
};

HurrGui = function ( gui, stormFile, stormCallback, udateCallback ) {
    this.gui = gui;
    this.stormCallback = stormCallback;

    this.options  = {};
    this.curStorm = undefined;
    this.storms = undefined;

    this.stormsGui         = undefined;
    this.updateStorms.gui  = undefined;
    this.updateEntries.gui = undefined;

    this.parmsGui  = undefined;
};

HurrGui.prototype = {
    /**
     * Update the existing controller for storms and create a new one.
     * Have to do it this way as there appears to be no easy way to
     * "refresh" the data in a controller
     */
    updateStorms: function ( year) {

        if (this.updateStorms.gui !== undefined)
            this.gui.remove(this.updateStorms.gui);

        this.storms = stormFile.getStormsForYear(Number(year));
        this.stormLabels = stormFile.getStormLabels(storms);
        this.options.stormLabels = stormLabels[0];

        this.updateStorms.gui = gfxScene.gui.add(options, "stormLabels", this.stormLabels).name("Storms");
        this.updateStorms.gui.onChange(stormsChange);
    },

    /**
     * Handle the change event for the storms controller
     */
    stormsChange: function () {
        var index = this.stormLabels.indexOf( this.options.stormLabels );
        this.curStorm = storms[index];
        this.updateEntries( this.curStorm );
        this.stormCallback( this.curStorm );
    },

    /**
     * Update existing controller for the entries and create a new one
     */
    updateEntries: function ( storm ) {
        if (this.updateEntries.gui !== undefined)
            this.gui.remove( this.updateEntries.gui );

        this.entryLabels = stormFile.getEntryLabels(storm);
        this.options.entryLabels = entryLabels[0];

        this.updateEntries.gui = gfxScene.gui.add(options, "entryLabels", entryLabels).name("Entries");
        this.updateEntries.gui.onChange(entriesChange);
    },

    /**
     * Handle the change event for the entries controller.  Not used yet.
     */
    entriesChange: function () {
        var index = this.entryLabels.indexOf( this.options.entryLabels );
    },

    /**
     * Set up the datgui controls on the basis of the loaded storm data
     */
    setupGuiStorms: function () {
        this.stormGui = this.gui.addFolder("Storms");

        this.years = this.stormFile.getYears();
        this.storms = this.stormFile.getStormsForYear( this.years[0] );
        this.stormLabels = this.stormFile.getStormLabels( this.storms );
        this.entryLabels = this.stormFile.getEntryLabels( this.storms[0] );

        this.options.year = years[0];
        this.options.stormLabels = this.stormLabels[0];
        this.options.entryLabels = this.entryLabels[0];
        this.options.update = function () {
            this.updateCallback();
        };

        var gui_year = stormGui.add(options, "year", years).name("Year").onChange(function () {
            console.log("Changed year");
            this.updateStorms( options.year );
            this.updateEntries( storms[0] );
        });

        this.updateStorms( this.options.year );

        this.curStorm = this.storms[0];
        updateEntries( this.curStorm );

        this.stormGui.add( this.options, 'update' );
    },

    setupDatGui: function () {

    }
};