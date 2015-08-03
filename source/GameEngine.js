var fs = require('fs');
var Sensor = require('./Sensor');
var Powerplant = require('./Powerplant');

function GameEngine() {
}

GameEngine.setLogger = function(logger) {
	this.logger = logger;
};

GameEngine.setTurnInterval = function(t) {
	this.turnInterval = t;	
};

GameEngine.loadBattle = function(battle) {
	this.turns = 0;
	this.shipClass = {};
	this.players = {};
	this.ships = {};
	this.battle = battle;
	this.powerplantObjs = {};
	this.logger.println('Number of players: ' + battle.length);

	// load all the component files
	this.sensors = this.loadComponentsFile('sensors'); 
	this.powerplants = this.loadComponentsFile('powerplants');

	// load the players
	for (var i = 0; i < battle.length; i++) {
		var player = battle[i];
		player.id = this.getNextId();
		this.players[player.id] = player;
		this.logger.println('Player ' + (i + 1) + ': ' + player.name + ' (' + player.id + ')');
		this.logger.println('With ' + player.ships.length + ' ships');
		// load the ship classes
		for (var j = 0; j < player.ships.length; j++) {
			var ship = player.ships[j];
			ship.id = this.getNextId();
			ship.playerId = player.id;
			this.ships[ship.id] = ship;
			var shipClassName = ship.classRef;
			// look for this class in the cache
			if (!this.shipClass.hasOwnProperty(shipClassName)) {
				this.shipClass[shipClassName] = this.loadShipClass(shipClassName);
			}
			ship.shipClass = this.shipClass[shipClassName];
			this.objectifyComponents(ship);
			this.logger.println('Ship: ' + ship.name + ' (' + ship.id + ') ' + ship.shipClass.tonnage + ' tonnes ' +  ship.shipClass.designation + ', ' + ship.shipClass.name + ' class');
		}
	}
};

GameEngine.computeTurn = function() {

// speed of light: 299,792,458 m / s
// distance earth to moon 384,400 km
// distance earth to the sun 149,600,000 km
// sensors use gravity detection, what range?

	this.turns++;

	this.logger.println('=== Starting turn #' + this.turns);
	console.log('Starting turn #' + this.turns);

	// loop over all the ships
	for (var property in this.ships) {
		if (this.ships.hasOwnProperty(property)) {
			var ship = this.ships[property];
			
			// 1. Provide power to components on the ship
			// TODO: is power produced every turn or every second? need to think about time
			this.powerComponents(ship);
			
			// 2. Scan for other ships
			// TODO: merge fleet contacts if in communication
			this.scan(ship);
			
			// 3. Move ship and calcuate new speeds
			this.move(ship);
		}
	}

	// for each ship:
		// determine available power
		// scan
		// determine disposition
		// select targets
		// set acceleration (fuel?)
		// fire weapons (ammmo?)
		// move ship
		
	// for each projectile
		// scan
		// set acceleration
		// move
		// determine fuel
		// explode?
		
	// write out a turn for all objects
};

GameEngine.powerComponents = function(ship) {
	this.logger.println(ship.name + ' producing power.');
	// reset power for this turn
	ship.power = 0;
	// loop through all the powerplants
	for (var i = 0; i < ship.powerplants.length; i++) {
		var powerplant = ship.powerplants[i];
		powerplant.producePower(ship);
	}		
	this.logger.println(ship.name + ' has ' + ship.power + ' MW available.');
	
	// loop through all the components, in order, and determine if they have power or not
	
	// FLT (if requested)
	// shields
	// sensors
	// engines
	// weapons
	
	for (var i = 0; i < ship.sensors.length; i++) {
		var sensor = ship.sensors[i];
		if (sensor.getPowerInput() <= ship.power) {
			ship.power -= sensor.getPowerInput();
			sensor.setPowered(true);
			this.logger.println('Powering sensors ' + sensor.getName() + '.');
		} else {
			sensor.setPowered(false);
			this.logger.println('No Power for sensors ' + sensor.getName() + '.');
		}
	}
	
	this.logger.println(ship.name + ' has ' + ship.power + ' MW in unused power.');

};

GameEngine.scan = function(ship) {

	// scanning is complex
	// ships must maintain sensor contact each turn
	// usually there is an increased chance to maintain contact 
	// ships may have multiple sensors
	// maintain a separate list of contacts for each sensor
	// computer merges these after all sensors have run

	this.logger.println(ship.name + ' performing sensor scan.');
	// loop through the sensors
	for (var i = 0; i < ship.sensors.length; i++) {
		var sensor = ship.sensors[i];
		this.logger.println('Using ' + sensor.getName() + ' sensors.');
			
		// loop through all ships and try to detect each
		for (var property in this.ships) {
			if (this.ships.hasOwnProperty(property)) {
				var targetShip = this.ships[property];
				// don't bother scanning ships from the same player
				if (ship.playerId != targetShip.playerId) {
					sensor.scan(ship, targetShip);
				}
			}
		}
	}		
	// merge all the contacts from all the sensors to create a contact list for the ship
	ship.contacts = {};
	
	// loop over each sensor
	for (var i = 0; i < ship.sensors.length; i++) {
		var sensor2 = ship.sensors[i];
		var contacts = sensor2.getContacts();
		// loop over each contact
		for (var contact in contacts) {
			if (contacts.hasOwnProperty(contact)) {
				if (contacts[contact] == true) {
					ship.contacts[contact] = true;
				}
			}
		}
	}
	
	// build a string for the log
	var msg = ship.name + ' has contacts for: ';
	for (var contact in ship.contacts) {
		if (contacts.hasOwnProperty(contact)) {
			if (contacts[contact] == true) {
				msg += this.ships[contact].name + ', ';
			}
		}
	}
	this.logger.println(msg);
};

GameEngine.move = function(ship) {
	// move the ship based on its current velocity
	// update the ship's velocity based on its current acceleration
	
	ship.position.x += ship.velocity.x * this.turnInterval;
	ship.position.y += ship.velocity.y * this.turnInterval;
	ship.position.z += ship.velocity.z * this.turnInterval;
	
	this.logger.println(ship.name + ' moved to (' + ship.position.x + ', ' + ship.position.y + ', ' + ship.position.z + ') km' );

	ship.velocity.x += ship.acceleration.x * this.turnInterval;
	ship.velocity.y += ship.acceleration.y * this.turnInterval;
	ship.velocity.z += ship.acceleration.z * this.turnInterval;

	this.logger.println(ship.name + ' accelerated to (' + ship.velocity.x + ', ' + ship.velocity.y + ', ' + ship.velocity.z + ') km/min' );
};

GameEngine.gameOver = function() {
	// just play 5 turns for now
	return (this.turns >= 5);
}

GameEngine.loadShipClass = function(className) {
	var copyList = [];
	this.logger.println('Loading class: ' + className);
	//TODO: check hash value to ensure that the computed values are up to date
	var thisClass = JSON.parse(fs.readFileSync('./ship_classes/' + className + '.json', 'utf8'));
	// flatten the components by repeating the component by the number of copies
	// TODO: this could be moved to the objectifyComponent method
	for (var i = 0; i < thisClass.components.length; i++) {
		var component = thisClass.components[i];
		if (component.copies && component.copies > 0) {
			// make copies of this component
			for (var j = 0; j < component.copies - 1; j++) {
				var copy = JSON.parse(JSON.stringify(component));
				delete copy['copies'];
				copyList.push(copy);
			}
			delete component['copies'];
		}
	}
	thisClass.components = thisClass.components.concat(copyList);
	return thisClass;
};

GameEngine.objectifyComponents = function(ship) {
	// need to make an object for each component
	// this is necessary since we need to maintain runtime information on each component
	// this can include, damage, ammo, contacts, etc...
	// this will also make it quick to iterate over each component type
	
	ship.sensors = [];
	ship.powerplants = [];
	
	for (var i = 0; i < ship.shipClass.components.length; i++) {
		var component = ship.shipClass.components[i];
		if (component.sensors) {
			var sensor = new Sensor();
			sensor.loadData(this.sensors[component.sensors]);
			sensor.setLogger(this.logger);
			ship.sensors.push(sensor);
		} else if (component.powerplants) {
			var powerplant = new Powerplant();
			powerplant.loadData(this.powerplants[component.powerplants]);
			powerplant.setLogger(this.logger);
			ship.powerplants.push(powerplant);
		}
	}
}; 

GameEngine.loadComponentsFile = function(fileName) {
	var path = './components/' + fileName + '.json';
	return JSON.parse(fs.readFileSync(path, 'utf8'));
};

GameEngine.getNextId = function() {
	if (!this.nextId) {
		this.nextId = 0;
	}
	this.nextId++;
	return 'ID_' + this.nextId;
};

module.exports = GameEngine;