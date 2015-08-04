var Util = require('./Util');
var Sensor = require('./Sensor');
var Powerplant = require('./Powerplant');
var Engine = require('./Engine.js');

function Ship() {
	this.thrust = 0;
	this.power = 0;
}

Ship.prototype.loadData = function(shipData) {
	this.data = shipData;
};

Ship.prototype.setId = function(id) {
	this.id = id;
};

Ship.prototype.getId = function() {
	return this.id;
}

Ship.prototype.setPlayerId = function(id) {
	this.playerId = id;
};

Ship.prototype.getPlayerId = function() {
	return this.playerId;
}

Ship.prototype.getShipClassRef = function() {
	return this.data.classRef;
};

Ship.prototype.setShipClass = function(shipClass) {
	this.shipClass = shipClass;
	this.objectifyComponents();
};

Ship.prototype.setLogger = function(logger) {
	this.logger = logger;
};

Ship.prototype.getName = function() {
	return this.data.name;
};

Ship.prototype.getTonnage = function() {
	return this.shipClass.tonnage;
};

Ship.prototype.getDesignation = function() {
	return this.shipClass.designation;
};

Ship.prototype.getShipClassName = function() {
	return this.shipClass.name;	
};

Ship.prototype.getMass = function () {
	return this.shipClass.mass;
};

Ship.prototype.getPosition = function() {
	return this.data.position;
};

Ship.prototype.setComponents = function(components) {
	this.components = components;
};

Ship.prototype.objectifyComponents = function() {
	// need to make an object for each component
	// this is necessary since we need to maintain runtime information on each component
	// this can include, damage, ammo, contacts, etc...
	// this will also make it quick to iterate over each component type
	
	// TODO: should be a more generic way to do this so I don't have to add code every time I add a new component type
	
	this.sensors = [];
	this.powerplants = [];
	this.engines = [];
	
	for (var i = 0; i < this.shipClass.components.length; i++) {
		var component = this.shipClass.components[i];
		if (component.sensors) {
			var sensor = new Sensor();
			sensor.loadData(this.components.getSensor(component.sensors));
			sensor.setLogger(this.logger);
			this.sensors.push(sensor);
		} else if (component.powerplants) {
			var powerplant = new Powerplant();
			powerplant.loadData(this.components.getPowerplant(component.powerplants));
			powerplant.setLogger(this.logger);
			this.powerplants.push(powerplant);
		}  else if (component.engines) {
			var engine = new Engine();
			engine.loadData(this.components.getEngine(component.engines));
			engine.setLogger(this.logger);
			this.engines.push(engine);
		}
	}
}; 

Ship.prototype.powerComponents = function() {
	this.logger.println(this.data.name + ' producing power.');
	// reset power for this turn
	this.power = 0;
	
	// loop through all the powerplants
	for (var i = 0; i < this.powerplants.length; i++) {
		var powerplant = this.powerplants[i];
		this.power += powerplant.producePower();
	}		
	this.logger.println(this.data.name + ' has ' + this.power + ' MW available.');
	
	// loop through all the components, in order, and determine if they have power or not
	
	// FLT (if requested / ordered)
	// shields
	// sensors
	// engines
	// weapons
	
	// sensors
	for (var i = 0; i < this.sensors.length; i++) {
		var sensor = this.sensors[i];
		if (sensor.getPowerInput() <= this.power) {
			this.power -= sensor.getPowerInput();
			sensor.setPowered(true);
			this.logger.println('Powering sensors ' + sensor.getName() + '.');
		} else {
			sensor.setPowered(false);
			this.logger.println('No Power for sensors ' + sensor.getName() + '.');
		}
	}
	
	// engines
	for (var i = 0; i < this.engines.length; i++) {
		var engine = this.engines[i];
		if (engine.getPowerInput() <= this.power) {
			this.power -= engine.getPowerInput();
			engine.setPowered(true);
			this.logger.println('Powering engines ' + engine.getName() + '.');
		} else {
			sensor.setPowered(false);
			this.logger.println('No Power for engines ' + engine.getName() + '.');
		}
	}
	
	this.logger.println(this.data.name + ' has ' + this.power + ' MW in unused power.');

};

Ship.prototype.scan = function(ships) {
	// scanning is complex
	// ships must maintain sensor contact each turn
	// usually there is an increased chance to maintain contact 
	// ships may have multiple sensors
	// maintain a separate list of contacts for each sensor
	// computer merges these after all sensors have run

	this.logger.println(this.data.name + ' performing sensor scan.');
	// loop through the sensors
	for (var i = 0; i < this.sensors.length; i++) {
		var sensor = this.sensors[i];
		this.logger.println('Using ' + sensor.getName() + ' sensors.');
			
		// loop through all ships and try to detect each
		for (var property in ships) {
			if (ships.hasOwnProperty(property)) {
				var targetShip = ships[property];
				// don't bother scanning ships from the same player
				if (this.playerId != targetShip.getPlayerId()) {
					sensor.scan(this, targetShip);
				}
			}
		}
	}		
	// merge all the contacts from all the sensors to create a contact list for the ship
	this.contacts = {};
	
	// loop over each sensor
	for (var i = 0; i < this.sensors.length; i++) {
		var sensor2 = this.sensors[i];
		var contacts = sensor2.getContacts();
		// loop over each contact
		for (var contact in contacts) {
			if (contacts.hasOwnProperty(contact)) {
				if (contacts[contact] == true) {
					this.contacts[contact] = true;
				}
			}
		}
	}
	
	// build a string for the log
	var msg = this.data.name + ' has contacts for: ';
	for (var contact in this.contacts) {
		if (contacts.hasOwnProperty(contact)) {
			if (contacts[contact] == true) {
				msg += ships[contact].getName() + ', ';
			}
		}
	}
	this.logger.println(msg);
};

Ship.prototype.move = function(t) {
	// move the ship based on its current velocity
	// update the ship's velocity based on its current acceleration
	
	// new position = old position + velocity * time
	this.data.position.x += this.data.velocity.x * t;
	this.data.position.y += this.data.velocity.y * t;
	this.data.position.z += this.data.velocity.z * t;
	
	this.logger.println(this.data.name + ' moved to (' + Util.round(this.data.position.x, 2) + ', ' + 
		Util.round(this.data.position.y,2) + ', ' + Util.round(this.data.position.z,2) + ') km' );

	// new velocity = old velocity plus acceleration * time
	this.data.velocity.x += this.data.acceleration.x * t;
	this.data.velocity.y += this.data.acceleration.y * t;
	this.data.velocity.z += this.data.acceleration.z * t;

	this.logger.println(this.data.name + ' accelerated to (' + Util.round(this.data.velocity.x,2) + ', ' + 
		Util.round(this.data.velocity.y,2) + ', ' + Util.round(this.data.velocity.z,2) + ') km/s' );

	// acceleration is an instaneous change based on the forces acting on the ship and the its heading
	// thrust in MN, mass in tonnes, divide by 1000 to get km/s^2
	var acceleration =  (this.thrust / this.shipClass.mass ) / 1000;
	
	this.data.acceleration.x = acceleration * this.data.heading.x;
	this.data.acceleration.y = acceleration * this.data.heading.y;
	this.data.acceleration.z = acceleration * this.data.heading.z;

	this.logger.println(this.data.name + ' acceleration changed to (' + Util.round(this.data.acceleration.x,2) + ', ' + 
		Util.round(this.data.acceleration.y,2) + ', ' + Util.round(this.data.acceleration.z,2) + ') km/s^2' );
};

Ship.prototype.setHeadingAndEngine = function(ships) {
	// TODO: need interesting logic to determine heading and engine settings
	// for now, just aim at closest contact and go full power
	
	// TODO: this is really a navigation computer function and should be part of a component
	// TODO: should be pluggable logic by ship designer
	// TODO: is also based on orders and disposition
	// TODO: Should anything happen if contact is lost
	
	// find closest contact
	var closest = null;
	var closestRange;
	for (var contact in this.contacts) {
		if (this.contacts.hasOwnProperty(contact)) {
			if (this.contacts[contact] == true) {
				var target = ships[contact];
				var range = Util.getRange(this.data.position, target.getPosition());	
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
		
		var x = (closest.getPosition().x - this.data.position.x) / closestRange;
		var y = (closest.getPosition().y - this.data.position.y) / closestRange;
		var z = (closest.getPosition().z - this.data.position.z) / closestRange;

		// the change in acceleration is dependent on the thrust and the mass of the ship * direction
		// calculate thrust produced by all functioning, powered engines
		
		this.thrust = 0;
		for (var i = 0; i < this.engines.length; i++) {
			var engine = this.engines[i];
			if (engine.getPowered()) {
				this.thrust += engine.produceThrust();
			}
		}

		// the direction or heading is (x,y,z)
		this.logger.println(this.data.name + ' accelerating toward ' + closest.name + ' (' + Util.round(x,2) + ', ' + Util.round(y,2) + ', ' + Util.round(z,2)  + ') with thrust ' + this.thrust + ' MN.');
		this.data.heading.x = x;
		this.data.heading.y = y;
		this.data.heading.z = z;
		
	} else {
		this.logger.println(this.data.name + ' maintaining course and thrust.');	
	}
};

module.exports = Ship;