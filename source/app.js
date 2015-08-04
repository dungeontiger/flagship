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

// set the logger
gameEngine.setLogger(logger);

// load players and fleets
gameEngine.loadBattle(JSON.parse(fs.readFileSync(gameDir + '/battle.json', 'utf8')));

// set the turn duration to 60 seconds
gameEngine.setTurnInterval(60);

while (!gameEngine.gameOver()) {
	gameEngine.computeTurn();
}

logger.release();