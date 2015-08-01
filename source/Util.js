
function Util() {
	
}

Util.getRange = function(ship, target) {
	return Math.sqrt( 
			Math.pow(ship.position.x - target.position.x, 2) + 
			Math.pow(ship.position.y - target.position.y, 2) + 
			Math.pow(ship.position.z - target.position.z, 2));
};

Util.round = function(value, decimals) {
	return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);	
};

Util.random = function() {
	return Math.random();	
};

module.exports = Util;