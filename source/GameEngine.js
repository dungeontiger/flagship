var fs = require('fs');
var Util = require('./Util');
var Sensor = require('./Sensor');
var Powerplant = require('./Powerplant');
var Engine = require('./Engine.js');

function GameEngine() {
}

GameEngine.setLogger = function(logger) {
	this.logger = logger;
};

GameEngine.setTurnInterval = function(t) {
	// seconds per turn
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
	this.engines = this.loadComponentsFile('engines');

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
			
			// 3. Move ship and calcuate new speed and acceleration
			this.move(ship);
			
			// 4. Set course and engine thrust
			this.setHeadingAndEngine(ship);
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
	
	// sensors
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
	
	// engines
	for (var i = 0; i < ship.engines.length; i++) {
		var engine = ship.engines[i];
		if (engine.getPowerInput() <= ship.power) {
			ship.power -= engine.getPowerInput();
			engine.setPowered(true);
			this.logger.println('Powering engines ' + engine.getName() + '.');
		} else {
			sensor.setPowered(false);
			this.logger.println('No Power for engines ' + engine.getName() + '.');
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
	
	// new position = old position + velocity * time
	ship.position.x += ship.velocity.x * this.turnInterval;
	ship.position.y += ship.velocity.y * this.turnInterval;
	ship.position.z += ship.velocity.z * this.turnInterval;
	
	this.logger.println(ship.name + ' moved to (' + Util.round(ship.position.x, 2) + ', ' + 
		Util.round(ship.position.y,2) + ', ' + Util.round(ship.position.z,2) + ') km' );

	// new velocity = old velocity plus acceleration * time
	ship.velocity.x += ship.acceleration.x * this.turnInterval;
	ship.velocity.y += ship.acceleration.y * this.turnInterval;
	ship.velocity.z += ship.acceleration.z * this.turnInterval;

	this.logger.println(ship.name + ' accelerated to (' + Util.round(ship.velocity.x,2) + ', ' + 
		Util.round(ship.velocity.y,2) + ', ' + Util.round(ship.velocity.z,2) + ') km/s' );

	// acceleration is an instaneous change based on the forces acting on the ship and the its heading
	// thrust in MN, mass in tonnes, divide by 1000 to get km/s^2
	var acceleration =  (ship.thrust / ship.shipClass.mass ) / 1000;
	
	ship.acceleration.x = acceleration * ship.heading.x;
	ship.acceleration.y = acceleration * ship.heading.y;
	ship.acceleration.z = acceleration * ship.heading.z;

	this.logger.println(ship.name + ' acceleration changed to (' + Util.round(ship.acceleration.x,2) + ', ' + 
		Util.round(ship.acceleration.y,2) + ', ' + Util.round(ship.acceleration.z,2) + ') km/s^2' );
};

GameEngine.setHeadingAndEngine = function(ship) {
	// TODO: need interesting logic to determine heading and engine settings
	// for now, just aim at closest contact and go full power
	
	// TODO: this is really a navigation computer function and should be part of a component
	// TODO: should be pluggable logic by ship designer
	// TODO: is also based on orders and disposition
	// TODO: Should anything happen if contact is lost
	
	// find closest contact
	var closest = null;
	var closestRange;
	for (var contact in ship.contacts) {
		if (ship.contacts.hasOwnProperty(contact)) {
			if (ship.contacts[contact] == true) {
				var target = this.ships[contact];
				var range = Util.getRange(ship, target);	
				if (range < closestRange || !closest) {
					closestRange = range;
					closest = target; 
				}
			}
		}
	}
	
	// if no contact, do not adjust course or engines
	if (closest) {
		// first we need a normalized vector toward the target ship, this will be the direction fo acceleration
		// normalized vector has a length of 1: x = (target.x - ship.x) / range, etc...
		
		var x = (closest.position.x - ship.position.x) / closestRange;
		var y = (closest.position.y - ship.position.y) / closestRange;
		var z = (closest.position.z - ship.position.z) / closestRange;

		// the change in acceleration is dependent on the thrust and the mass of the ship * direction
		// calculate thrust produced by all functioning, powered engines
		
		var thrust = 0;
		for (var i = 0; i < ship.engines.length; i++) {
			var engine = ship.engines[i];
			if (engine.getPowered()) {
				thrust += engine.produceThrust(ship);
			}
		}

		// the direction or heading is (x,y,z)
		this.logger.println(ship.name + ' accelerating toward ' + closest.name + ' (' + Util.round(x,2) + ', ' + Util.round(y,2) + ', ' + Util.round(z,2)  + ') with thrust ' + thrust + ' MN.');
		ship.thrust = thrust;
		ship.heading.x = x;
		ship.heading.y = y;
		ship.heading.z = z;
		
	} else {
		this.logger.println(ship.name + ' maintaining course and thrust.');	
	}
};

GameEngine.gameOver = function() {
	// TODO: determine ending conditions: no ships left from one side or maximum number of turns
	// just play 10 turns for now
	return (this.turns >= 10);
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
	
	// TODO: should be a more generic way to do this so I don't have to add code every time I add a new component type
	
	ship.sensors = [];
	ship.powerplants = [];
	ship.engines = [];
	
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
		}  else if (component.engines) {
			var engine = new Engine();
			engine.loadData(this.engines[component.engines]);
			engine.setLogger(this.logger);
			ship.engines.push(engine);
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