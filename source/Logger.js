// game information logger
var fs = require('fs');

function Logger() {
	this.log = null;
};

Logger.create = function(path) {
	var logpath = path + '/log';
	// ignore exception if directory already exksts
	try {
		fs.mkdirSync(logpath);
	}
	catch (e) {
		
	}
	this.log = fs.createWriteStream(logpath + '/battle.log');
	this.println('Flagship Battle Log');
};

Logger.print = function(s) {
	this.log.write(s);
};

Logger.println = function(s) {
	this.print(s + '\n');
}

Logger.release = function() {
	this.println('End of log.')
	if (this.log) {
		this.log.end();
	}
}

module.exports = Logger;