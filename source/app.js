// testing harness for flagship

// load the battle
// start the log
// load all the necessary ship classes and cache them
// initialize the ship values
// start the simulation loop
var fs = require('fs');
var logger = require('./Logger');
var gameEngine = require('./GameEngine');

var game = process.argv[2];
var gameDir = './games/' + game;

logger.create(gameDir);
logger.println('Game: ' + game);

gameEngine.setLogger(logger);
gameEngine.loadBattle(JSON.parse(fs.readFileSync(gameDir + '/battle.json', 'utf8')));

while (!gameEngine.gameOver()) {
	gameEngine.computeTurn();
}

logger.release();