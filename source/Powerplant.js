function Powerplant() {
	
}

Powerplant.prototype.loadData = function(powerplantData) {
	this.powerplant = powerplantData;	
};

Powerplant.prototype.setLogger = function(logger) {
	this.logger = logger;
};

Powerplant.prototype.getName = function() {
	return this.powerplant.name;	
};

Powerplant.prototype.producePower = function(ship) {
	ship.power += this.powerplant.output;
	this.logger.println(this.powerplant.name + ' produces ' + this.powerplant.output + ' MW.');
};

module.exports = Powerplant;
