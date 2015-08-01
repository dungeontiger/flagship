var Util = require('./Util');
// class to manage sensors

// basic sensors:
	// dectect chance = optimal_range / target_range^2 * target_mass / optimal_mass
	// first detect is for lock
	// if not lock, second detect is for contact (*2?s)

function Sensor() {
	this.powered = false;
}

Sensor.prototype.loadData = function(sensorData) {
	this.sensor = sensorData;	
};

Sensor.prototype.setLogger = function(logger) {
	this.logger = logger;
};

Sensor.prototype.getName = function() {
	return this.sensor.name;	
};

Sensor.prototype.getPowerInput = function() {
	return this.sensor.power;
};

Sensor.prototype.getPowered = function() {
	return this.powered;
};

Sensor.prototype.setPowered = function(powered) {
	this.powered = powered;
};

Sensor.prototype.getContacts = function() {
	return this.contacts;
};

Sensor.prototype.scan = function(ship, target) {
	// each sensor maintains its own contact list
	if (!this.contacts) {
		this.contacts = {};
	}
	
	var prevDetect = false;
	if (this.contacts[target.id]) {
		prevDetect = true;
	}
	
	var range = Util.getRange(ship, target);
	this.logger.println('Range from ' + ship.name + ' to ' + target.name + ' is ' + range + ' km.');
	
	if (this.sensor.type == 'basic') {
		// chance to detect is proportial to mass of target and inversely propertional to distance to targe
		var chance = target.shipClass.mass / this.sensor.targetMass * Math.pow( this.sensor.targetRange / range, 2);

		// chance is double if maintaining contact
		if (prevDetect) {
			chance *= 2;
		}

		if (Util.random() < chance) {
			// detected!
			this.contacts[target.id] = true;
			if (prevDetect) {
				this.logger.println('Maintained contact to ' + target.name + ' chance was ' + Util.round(chance * 100, 2) + '%');
			} else {
				this.logger.println('Detected ' + target.name + ' chance was ' + Util.round(chance * 100, 2) + '%');
			}
		} else {
			// not detected!
			this.contacts[target.id] = false;
			if (prevDetect) {
				this.logger.println('Lost contact to ' + target.name + ' chance was ' + Util.round(chance * 100, 2) + '%');
			} else {
				this.logger.println('Failed to detect ' + target.name + ' chance was ' + Util.round(chance * 100, 2) + '%');
			}
		}
	}
};

module.exports = Sensor;