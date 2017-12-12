/*
 * Hurricane Model.
 * Based on work by Holland et al, 1990
 *
 * Original Fortran (!) code by Michael Drayton.
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 */

var HUMODEL = {
    revision: 'r01',

    PERIPHERAL_PRESSURE : 1013.0,	// in mB
    INFLOW_ANGLE : 20.0,
    CORIOLIS : 2.0e-5,	// Coriolis parameter in the tropics (1/s)
    MIN_PRESSURE_DIFFERENCE : 0.1,
    AIR_DENSITY	: 1.225,

    // AZIM2MATHR(azim) ((PI+HALF_PI)-azim)
    // AZIM2MATHD(azim) ((450.0)-azim)

    MISSING : -999
};

/**
 * Initialize the parameters that control hurricane sim
 *
 */
HUMODEL.HuModel = function (  ) {

    this.metData = undefined;
    this.bStormFile = undefined;	        // just for info's sake

    this.dataNodeStep = 0.5;				// in degrees

    this.radiusStormInfluence = 750.0;		// radius of storm influence, in km
    this.nRadialSamples  = 12;				// number of steps outward (radial( to be sampled
    this.nAngularSamples = 15;				// number of angular samples

    this.samplePosition = undefined;
    this.sampleDistance = undefined;
    this.sampleAngle    = undefined;
    this.sampleData     = undefined;

    this.mapProj       = undefined;
};

HUMODEL.HuModel.prototype = {

    /**
     *
     */
    initialise: function () {

        // if we're working form a user-file, then override any other initialisers
        if (m_bStormFile)
            InitialiseFromStormData();

        m_pMapProj = pMapProj;

        m_mapProj.Set( miTransverseMercator,		// Type,
            miNAD27ContinentalUS,		// Datum,
            miUnitMeter,					// Units,
            m_initialPosX,					// OriginLongitude
            0.0,								// OriginLatitude, the equator
            0.0,								// StandardParallelOne
            0.0,								// StandardParallelTwo
            0.0,								// Azimuth
            0.9996,							// ScaleFactor,
            500000.0,						// FalseEasting,
            0.0,								// FalseNorthing,
            0.0 );							// Range

        m_nCurStep = 0;
        m_curTime  = 0.0;

        m_centreOnScreen = TRUE;
        m_onLand         = FALSE;   // a safe assumption...

        // we need the positions in metres
        m_yVelNow         = 0.0;
        m_xVelNow         = 0.0;
        m_maxVelocity     = 1.0;
        m_maxLandVelocity = 0.0;

        m_signHemisphere = (m_initialPosY < 0.0) ? -1.0 : 1.0;

        // just assign these
        m_xNow    = m_initialPosX;
        m_yNow    = m_initialPosY;
        m_xCycNow = m_initialPosX;
        m_yCycNow = m_initialPosY;

        // we need the initial central pressure in pascals
        m_centralPressurePascals = m_centralPressure * 100.0;

        // we need the peripheral pressure in pascals as well
        m_peripheralPressurePascals = m_peripheralPressure * 100.0;

        m_deltPressure = m_peripheralPressurePascals - m_centralPressurePascals;
        m_centreFilled = m_deltPressure > MIN_PRESSURE_DIFFERENCE;

        // set limits on RMax ( in metres )
        m_rMaxMax = 200000.0;    // 200 km
        m_rMaxMin = 2000.0;      // 2 km

        // we need it converted to metres, but don't let it over-range
        m_radiusToMaxWindMetres = CLAMP( m_radiusToMaxWind * 1000.0, m_rMaxMax, m_rMaxMin );

        // hardcode the inflow angle (why?)
        m_inflowAngle = DEG2RAD( INFLOW_ANGLE );

        //-----filling rate over land - convert to Pascals/sec
        m_fillingRatePascals = m_fillingRate / 36.0;

        // covert rate of increase in RMAX over land to m/s
        m_rateOfIncreaseMetres = m_rateOfIncrease / 3.6;

        // convert to the cyclone azimuth to radians
        m_cycloneAzimuthRadians = DEG2RAD( m_cycloneAzimuth );
        m_TSSinAzimuth = m_translationalSpeed * sin( m_cycloneAzimuthRadians ) * m_dTimeStep;
        m_TSCosAzimuth = m_translationalSpeed * cos( m_cycloneAzimuthRadians ) * m_dTimeStep;

        // convert inflow-angle to radians
        m_alpha = -m_inflowAngle - HALF_PI;		// was positive alpha...
        // m_alpha = m_inflowAngle;

        //-----asymmetric part ----
        m_T0  = 0.514791;	// hmmm, what is this constant?
        m_ATT = 1.5 * pow(m_translationalSpeed, 0.63) * pow(m_T0, 0.37);

        //-----Initial Holland model parameters
        //		B parameter - based on central pressure (in millibars)
        m_bHolland = 1.5 + (980.0 - m_centralPressurePascals / 100.0) / 120.0;

        // A parameter - based on distance in kilometres
        m_aHolland  = pow( (m_radiusToMaxWindMetres / 1000.0), m_bHolland );

        // density of air (kg/m^3)
        m_airDensity = AIR_DENSITY;

        // clean up the storage arrays, as necessary
        m_stormTrack.RemoveAll();
        if (!m_bStormFile)
            m_stormArray.RemoveAll();

    },

    /**
     * Finds all neighbors of the specified cell.  Each neighbor is pushed onto
     * the "stack" (actually just an array list.
     *
     * @param x - current index into the array
     * @param y
     */
    findNeighbors: function (  x, y ) {

        var     zx,zy;

        for ( var i=0; i<4; i++ ) {

            zx = x + HUMODEL.XEdge[i];
            zy = y + HUMODEL.YEdge[i];

            // if indicies in range and cell still zero then the cell is still in the "src list"
            if (zx >= 0 && zx < this.col && zy >= 0 && zy < this.row
                        && this.cells[zy * this.row + zx] === 0) {

                // set the upper bits to indicate that this cell has been "found"
                this.cells[zy * this.row + zx] = 0xf0;

                this.neighbors.push(new HUMODEL.Coord(zx,zy));

                //console.log("Adding to neighbors: " + zx.toFixed(0) + " " + zy.toFixed(0));

                this.maxNeighbors = Math.max( this.maxNeighbors, this.neighbors.length );
            }
        }
    },

    /**
     * Dissolves the edge between the specified cell and one of the
     * adjacent cells in the spanning tree.  However, it does so ONLY
     * if the adjacent cell is already part of the "maze tree", i.e.
     * it won't open a cell into an unvisited cell.
     * The algorithm is such that it is guaranteed that each cell will
     * only be visited once.
     *
     * @param x - cur index
     * @param y
      * return - true if added to the tree
     */
    dissolveEdge: function( x, y ) {

        var		edg;
        var     edgeRay = [];
        var		zx,zy;
        var     cellVal;

        // build the fence for this cell
        this.cells[y * this.row + x] = 0xff;

        for ( var i=0; i<4; i++ ) {

            zx = x + HUMODEL.XEdge[i];
            zy = y + HUMODEL.YEdge[i];

            // if indicies in range and cell has been visited, push it on the local stack
            cellVal = this.cells[zy * this.row + zx] & HUMODEL.OppEdgeBit[i];
            if ( zx >= 0 && zx < this.col && zy >= 0 && zy < this.row && cellVal !== 0 ) {

                edgeRay.push( i );
            }
        }

        if ( edgeRay.length > 0 ) {

            var n = this.getRandomInt(0, edgeRay.length);
            edg = edgeRay[n];
            zx  = x + HUMODEL.XEdge[edg];
            zy  = y + HUMODEL.YEdge[edg];

            this.cells[y * this.row + x]   ^= HUMODEL.EdgeBit[edg];
            this.cells[zy * this.row + zx] ^= HUMODEL.OppEdgeBit[edg];

            //console.log("In cell " + x.toFixed(0) + " " + y.toFixed(0) +
             //   " dissolving edge: " + this.EdgeStr[edg] + " into cell: " + zx.toFixed(0) + " " + zy.toFixed(0));
        }
    },

    /**
     * Dissolve the specified edge of the seed cell to form an exit
     * @param edg
     */
    dissolveExit: function ( edg ) {
        this.cells[this.seedY * this.row + this.seedX]   ^= HUMODEL.EdgeBit[edg];
    },

    /**
     * Get a random integer between the minimum and the maximum.  The result may include the minimum
     * but will NOT include the maximum.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     *
     * @param min
     * @param max
     */
    getRandomInt: function ( min, max ) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    },

    /**
     * Return a random integer between min and max. The result may include the minimum
     * but will NOT include the maximum.  The random value is pulled from a static list of
     * pre-generated list of random values. This is to allow reproducible mazes.
     */
    getRandomInt2: function ( min, max ) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.random.pop() * (max - min)) + min;
    },
    /**
     * @param col
     * @param row
     */
    dumpEdges: function(  col, row ) {
        for ( var  i=0; i<row; i++)
            for ( var  j=0; j<col; j++ )
            {
                var mz = this.cells[i * this.row + j];
                console.log(i.toFixed(0) + " " + j.toFixed(0) +
                    " S: " + (mz & HUMODEL.SOUTH_BIT) + " W: " + (mz & HUMODEL.WEST_BIT) +
                    " N: " + (mz & HUMODEL.NORTH_BIT) + " E: " + (mz & HUMODEL.EAST_BIT)  );
            }
    }
};


