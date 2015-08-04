var fs = require('fs');
var Util = require('./Util');
var Ship = require('./Ship.js');
var Components = require('./Components.js');

function GameEngine() {
}

GameEngine.initialize = function() {
	this.components = new Components();
	this.components.load();
};

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
	this.logger.println('Number of players: ' + battle.length);

	// load the players
	for (var i = 0; i < battle.length; i++) {
		var player = battle[i];
		player.id = this.getNextId();
		this.players[player.id] = player;
		this.logger.println('Player ' + (i + 1) + ': ' + player.name + ' (' + player.id + ')');
		this.logger.println('With ' + player.ships.length + ' ships');
		// load the ship classes
		for (var j = 0; j < player.ships.length; j++) {
			var ship = new Ship();
			ship.loadData(player.ships[j]);
			ship.setComponents(this.components);
			ship.setId(this.getNextId());
			ship.setLogger(this.logger);
			ship.setPlayerId(player.id);
			this.ships[ship.id] = ship;
			var shipClassName = ship.getShipClassRef();
			// look for this class in the cache
			if (!this.shipClass.hasOwnProperty(shipClassName)) {
				this.shipClass[shipClassName] = this.loadShipClass(shipClassName);
			}
			ship.setShipClass(this.shipClass[shipClassName]);
			this.logger.println('Ship: ' + ship.getName() + ' (' + ship.id + ') ' + ship.getTonnage() + ' tonnes ' +  ship.getDesignation() + ', ' + ship.getShipClassName() + ' class');
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
	// TODO: should each step be done for each ship instead...i.e., all ships power compoennts, then scan, etc...
	for (var property in this.ships) {
		if (this.ships.hasOwnProperty(property)) {
			var ship = this.ships[property];
			
			// 1. Provide power to components on the ship
			// TODO: is power produced every turn or every second? need to think about time
			ship.powerComponents();
			
			// 2. Scan for other ships
			// TODO: merge fleet contacts if in communication
			ship.scan(this.ships);
			
			// 3. Move ship and calcuate new velocity and acceleration
			ship.move(this.turnInterval);
			
			// 4. Set course and engine thrust
			ship.setHeadingAndEngine(this.ships);
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

GameEngine.getNextId = function() {
	if (!this.nextId) {
		this.nextId = 0;
	}
	this.nextId++;
	return 'ID_' + this.nextId;
};

module.exports = GameEngine;