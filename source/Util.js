
function Util() {
	
}

Util.getRange = function(shipPos, targetPos) {
	return Math.sqrt( 
			Math.pow(shipPos.x - targetPos.x, 2) + 
			Math.pow(shipPos.y - targetPos.y, 2) + 
			Math.pow(shipPos.z - targetPos.z, 2));
};

Util.round = function(value, decimals) {
	return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);	
};

Util.random = function() {
	return Math.random();	
};

module.exports = Util;