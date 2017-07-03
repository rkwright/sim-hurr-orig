package com.geofx.example.erosion;
/*
 * @author rkwright / www.geofx.com
 *
 * All rights reserved.
 *
 */

var MAZE = { revision: '01' };

MAZE.MazeCell = function ( westCell, northCell ) {
{
	this.EdgeStr      =  {   "S", "W", "N", "E" };
	this.EdgeBit      =  {   GeoCell.SOUTH_BIT,  GeoCell.WEST_BIT,  GeoCell.NORTH_BIT,  GeoCell.EAST_BIT };
	this.			OppEdgeBit   =  {   GeoCell.NORTH_BIT,  GeoCell.EAST_BIT,  GeoCell.SOUTH_BIT,  GeoCell.WEST_BIT };
	this.			XEdge        =  {   0, -1,  0,  1 };
	this.			YEdge        =  {  -1,  0,  1,  0 };
	this.		EdgeIndx     =  { {  -1,  0,  -1 }, 
												  {   1, -1,   3 },
	                                              {  -1,  2,  -1 }  };

	this.    		DirShift = { GeoCell.SOUTH_SHIFT, GeoCell.WEST_SHIFT, GeoCell.NORTH_SHIFT, GeoCell.EAST_SHIFT };
	this.   		DirMask  = { GeoCell.SOUTH_MASK,  GeoCell.WEST_MASK,  GeoCell.NORTH_MASK,  GeoCell.EAST_MASK };

	this.SOUTH = 0;              // the cardinal directions 
	this.WEST  = 1;
	this.NORTH = 2;
	this.EAST  = 3;

	this.SOUTH_BIT = 1;          // 1 << (cardinal_direction)
	this.WEST_BIT  = 2;
	this.NORTH_BIT = 4;
	this.EAST_BIT  = 8;

	this.SOUTH_MASK = 0xff; 	    // 0xff << (cardinal_shift)
	this.WEST_MASK  = 0xff00;
	this.NORTH_MASK = 0xff0000;
	this.EAST_MASK  = 0xff000000;

	this.SOUTH_SHIFT = 0; 	    // (log2 (cardinal_direction)) << 3
	this.WEST_SHIFT  = 8;
	this.NORTH_SHIFT = 16;
	this.EAST_SHIFT  = 24;

	public GeoCell( double volume, GeoCell westCell, GeoCell northCell )
	{
		this.volume = volume;
		
		if (westCell != null)
		{
			neighbor[WEST] = westCell;
			westCell.neighbor[EAST] = this;
		}
		
		if (northCell != null)
		{
			neighbor[NORTH] = northCell;
			northCell.neighbor[SOUTH] = this;
		}	
	}
}
