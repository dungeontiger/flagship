function Engine() {
	this.powered = false;
}

Engine.prototype.loadData = function(engineData) {
	this.engine = engineData;	
};

Engine.prototype.setLogger = function(logger) {
	this.logger = logger;
};

Engine.prototype.getName = function() {
	return this.engine.name;	
};

Engine.prototype.getPowerInput = function() {
	return this.engine.power;
};

Engine.prototype.getPowered = function() {
	return this.powered;
};

Engine.prototype.setPowered = function(powered) {
	this.powered = powered;
};

Engine.prototype.produceThrust = function() {
	// TODO: for now engines are on/off only
	return this.engine.thrust;
}

module.exports = Engine;