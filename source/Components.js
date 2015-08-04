var fs = require('fs');

function Components() {
	
}

Components.prototype.load = function() {
	// load all the component files
	this.sensors = this.loadComponentsFile('sensors'); 
	this.powerplants = this.loadComponentsFile('powerplants');
	this.engines = this.loadComponentsFile('engines');
};

Components.prototype.getSensor = function(id) {
	return this.sensors[id];	
};

Components.prototype.getPowerplant = function(id) {
	return this.powerplants[id];	
};

Components.prototype.getEngine = function(id) {
	return this.engines[id];	
};

Components.prototype.loadComponentsFile = function(fileName) {
	var path = './components/' + fileName + '.json';
	return JSON.parse(fs.readFileSync(path, 'utf8'));
};

module.exports = Components;