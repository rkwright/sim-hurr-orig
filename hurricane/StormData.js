/*
 * Storm-data loading facilities
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 */

/**
 * Constants
 */
var StormData = {
    revision: 'r01'
};

/**
 * Pseudo constructor
 * @constructor
 */
StormData.StormData = function () {
    this.stormFile = undefined;
    this.jsonData  = undefined;
};

StormData.StormData.prototype = {

    loadJSON: function(callback) {

        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', this.stormFile, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                console.log(xobj.getAllResponseHeaders());
            }

            if (xobj.readyState === XMLHttpRequest.DONE && xobj.status === HttpStatus.OK) {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    },

    /**
     * Load the data from the specified JSON file, then parse the
     * resuling payload
     * @param stormFile
     */
    loadData: function( stormFile ) {

        this.stormFile = stormFile;
        loadJSON(function(response) {
            // Parse JSON string into object
            this.jsonData = JSON.parse(response);
        });
    },

    /**
     * Getter for the JSON data
     * @returns {*}
     */
    getJSON:  function () {
        return this.jsonData;
    }

/**
 * Load the data for a single storm from a file
 */
/*    loadData: function (fileName )  {
var MAX_LEN	= 256;

    char			buf[MAX_LEN+1];
    FILE*			fp = NULL;
    CStormParm	stormParm;
    int			nDate;
    int			nDay;
    int			nMonth;
    int			nYear;
    int			nJulian;
    int			nHour;
    double		lon;
    double		lat;
    double		heading;
    double		speed;
    double		pressure;
    double		newValue;

    this.stormArray.RemoveAll();
    if ( strlen(fileName) == 0)
        return true;

    // try to open the input file
    if ((fp = fopen( fileName,"rt")) == (FILE *) 0)
    {
        return ErrorMsg("Couldn't open file: '%s' for reading hurricane data", fileName);
    }

    int	nLine = 0;
    while (!feof(fp))
    {
        nLine++;

        if ( ReadString( fp, buf, MAX_LEN) == -1)
        {
            fclose(fp);
            return ErrorMsg("Failed file read in line %d of %s", nLine, fileName);
        }

        while ( strlen(buf) > 0 && (buf[0] == ' ' || buf[0] == '\t'))
        {
            int	len = strlen(buf);
            memcpy(&buf[0], &buf[1], len-1);
            buf[len-1] = '\0';
        }

        if (strlen(buf) > 0)
        {
            if ( sscanf( buf, "%d %d %lf %lf %lf %lf %lf", &nDate, &nHour, &lat, &lon, &heading, &speed, &pressure ) != 7)
            {
                fclose(fp);
                return ErrorMsg("Wrong number of args in line %d of %s", nLine, fileName);
            }


            nYear   = nDate % 100;
            nMonth  = (nDate / 100) % 100;
            nDay    = (nDate / 10000) % 100;
            nJulian = CCalendar::Julian( nDay, nMonth, nYear );

            stormParm.SetDay( nDay );
            stormParm.SetMonth( nMonth );
            stormParm.SetYear( nYear );
            stormParm.SetJulianDay( nJulian );
            stormParm.SetHour( nHour );

            stormParm.SetX( lon );
            stormParm.SetY( lat );
            stormParm.SetHeading( heading );
            stormParm.SetFwdVelocity( speed );
            stormParm.SetPressure( pressure );

            this.stormArray.Add( stormParm );
        }
    }

    fclose(fp);

    // now walk through and try to interpolate any missing values
    int		i         = 0;
    double	prop      = 1.0;
    bool		bTween    = false;
    int		prev = 1;
    int		next = 2;
    bool		bOK = false;
    while ( i<this.stormArray.GetSize() )
    {
        if ( this.stormArray[i].GetHeading() == MISSING)
        {
            bOK = false;
            if ( i != 0 && i != (this.stormArray.GetSize() - 1))
                bOK = Interpolate( this.stormArray[i-1].GetHeading(), this.stormArray[i+1].GetHeading(), 0.5, newValue, MISSING, true );

            if (!bOK &&  i > 1)
                bOK = Interpolate( this.stormArray[i-1].GetHeading(), this.stormArray[i-2].GetHeading(), 1.0, newValue, MISSING, false );

            if (!bOK &&  i < (this.stormArray.GetSize() - 3))
                bOK = Interpolate( this.stormArray[i+1].GetHeading(), this.stormArray[i+2].GetHeading(), 1.0, newValue, MISSING, false );

            if (!bOK)
            {
                this.stormArray.RemoveAt(i);
                continue;
            }

            this.stormArray[i].SetHeading( newValue );
        }

        if ( this.stormArray[i].GetFwdVelocity() == MISSING)
        {
            bOK = false;
            if ( i != 0 && i != (this.stormArray.GetSize() - 1))
                bOK = Interpolate( this.stormArray[i-1].GetFwdVelocity(), this.stormArray[i+1].GetFwdVelocity(), 0.5, newValue, MISSING, true );

            if (!bOK && i > 1)
                bOK = Interpolate( this.stormArray[i-1].GetFwdVelocity(), this.stormArray[i-2].GetFwdVelocity(), 1.0, newValue, MISSING, false );

            if (!bOK &&  i < (this.stormArray.GetSize() - 3))
                bOK = Interpolate( this.stormArray[i+1].GetFwdVelocity(), this.stormArray[i+2].GetFwdVelocity(), 1.0, newValue, MISSING, false );

            if (!bOK)
            {
                this.stormArray.RemoveAt(i);
                continue;
            }

            this.stormArray[i].SetFwdVelocity( newValue );
        }

        if ( this.stormArray[i].GetPressure() == MISSING)
        {
            bOK = false;
            if ( i != 0 && i > 0 && i < (this.stormArray.GetSize() - 1))
                bOK = Interpolate( this.stormArray[i-1].GetPressure(), this.stormArray[i+1].GetPressure(), 0.5, newValue, MISSING, true );

            if (!bOK && i > 1)
                bOK = Interpolate( this.stormArray[i-1].GetPressure(), this.stormArray[i-2].GetPressure(), 1.0, newValue, MISSING, false );

            if (!bOK && i < (this.stormArray.GetSize() - 3))
                bOK = Interpolate( this.stormArray[i+1].GetPressure(), this.stormArray[i+2].GetPressure(), 1.0, newValue, MISSING, false );

            if (!bOK)
            {
                this.stormArray.RemoveAt(i);
                continue;
            }

            this.stormArray[i].SetPressure( newValue );
        }

        i++;
    }

    // now dump the results
    for ( i=0; i<this.stormArray.GetSize(); i++ )
    {
        TRACE(" %02d%02d%02d %6dd %4dh: %8.3f %8.3f  %8.3f  %8.3f  %8.3f\n",
            this.stormArray[i].GetDay(),
            this.stormArray[i].GetMonth(),
            this.stormArray[i].GetYear(),
            this.stormArray[i].GetJulianDay(),
            this.stormArray[i].GetHour(),
            this.stormArray[i].GetX(),
            this.stormArray[i].GetY(),
            this.stormArray[i].GetHeading(),
            this.stormArray[i].GetFwdVelocity(),
            this.stormArray[i].GetPressure() );
    }

    this.bStormFile = true;

    return true;
},
    /**
     * Read a string from the specified file up to the first newline char.
     *	It then strips any newline chars (either CR or LF from the resulting
     *	string
     */
/*
readString: funciton( FILE* fp, char* str, int maxLen )
{
str[0] = '\0';

if ( !fgets( str, maxLen, fp ) && !feof(fp))
    return -1;

if ( str[strlen(str)-1] == LF)
    str[strlen(str)-1] = '\0';

return 0;
}*/

};