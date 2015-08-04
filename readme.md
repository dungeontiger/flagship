Flagship Space Fleet Combat Simulator
=====================================

Players will design ships and fleets for a specific budget, find an opponent and submit their fleets for battle.
The server code - simulator - will determine the results and send them back to the player.

Early Development
-----------------

Currently the engine is being designed so the components and ships are just test subjects.

You can try the test battle by navigating to the flagship directory and entering:

`node source app.js test`

The simulation will run for 5 turns and the results will be written to a log in the games\test directory.

If you want to try and create your own ship classes, you can do that by creating a file with shipName.json in the ship_classes directory.
Once you do that you need to process the class.  To do that navigate to the ship_classes directory and enter:

`node processClass.js shipClassName`

The file shipClassName.json will be overwritten with new details.

A Note on Units
---------------

Unless otherwise stated, the units of measure used are:

* distance in kilometers (km)
* currency in Megacredits (MCr)
* time in seconds (s)
* mass in (metric) tonnes (t)
* force in MegaNewtons (MN)
* power in MegaWatts (MW)
