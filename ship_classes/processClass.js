// use this class to process a ship class, run some calculations and create a hash to make sure it has not changed
 
var fs = require('fs');
var crypto = require('crypto');
 
var shipClassName = process.argv[2];
var shipClass = JSON.parse(fs.readFileSync(shipClassName  + '.json', 'utf8'));

// calculate these values and write them out
var mass = 0;
var cost = 0;

// component json
var sensors = null;
var weapons = null;
var powerplants = null;
var engines = null;

console.log("Processing ship class: " + shipClass.name);

// initialize the component library

// to verify the class we need to read all the components first and sum up the mass
for (var i = 0; i < shipClass.components.length; i++) {
	var component = getComponent(shipClass.components[i]);
	if (shipClass.components[i].copies) {
		console.log('...' + shipClass.components[i].copies + ' copies');
		mass += (component.mass * shipClass.components[i].copies);
		cost += (component.cost * shipClass.components[i].copies);
	} else {
		mass += component.mass;
		cost += component.cost;
	}
}

// add a mass percentage 20% for pilots and generic equipment, minimum 5 tonnes
var genericMass = Math.max( 5, mass * 0.2 );
mass += genericMass;

// cost of generic mass is 10 MCr per tonne
cost += 10 * genericMass;

// choose a designation based on the total mass
shipClass.designation = getDesignation(mass);

// update the tonnage which is a nice number to indicate size
shipClass.tonnage = Math.round(mass);

// make backup class file?

// update ship and write it out
shipClass.mass = mass;
shipClass.cost = cost;
fs.writeFileSync(shipClassName + '.json', JSON.stringify(shipClass, null, 3));

// create a hash on the class file and write out it out for future verification
var hasher = crypto.createHash('md5'); 
var s = fs.ReadStream(shipClassName + '.json'); 
s.on('data', function(d) {
	hasher.update(d); 
});

s.on('end', function() {
	var hash = hasher.digest('hex'); 
	writeHashFile(shipClassName, hash);
});

// end

function getComponent(componentRef) {
	if (componentRef.sensors) {
		console.log('...sensors: ' + componentRef.sensors);
		if (!sensors) {
			sensors = loadComponentsFile('sensors');
		}
		return sensors[componentRef.sensors];
	} else if (componentRef.weapons) {
		console.log('...weapons: ' + componentRef.weapons);
		if (!weapons) {
			weapons = loadComponentsFile('weapons');
		}
		return weapons[componentRef.weapons];
	} else if (componentRef.powerplants) {
		console.log('...powerplants: ' + componentRef.powerplants);
		if (!powerplants) {
			powerplants = loadComponentsFile('powerplants');
		}
		return powerplants[componentRef.powerplants];
	} else if (componentRef.engines) {
		console.log('...engines: ' + componentRef.engines);
		if (!engines) {
			engines = loadComponentsFile('engines');
		}
		return engines[componentRef.engines];
	}
}

function loadComponentsFile(fileName) {
	var path = '../components/' + fileName + '.json';
	return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeHashFile(shipClassName, hash) {
	var hashFile = fs.createWriteStream(shipClassName + '.hash');
	hashFile.write(hash);
	hashFile.end();	
}

function getDesignation(shipMass) {
	var designations = [
		{
			mass: 100,
			designation: 'Light Fighter'
		},
		{
			mass: 500,
			designation: 'Fighter'
		},
		{
			mass: 1000,
			designation: 'Heavy Fighter'
		},
		{
			mass: 5000,
			designation: 'Patrol Boat'	
		},
		{
			mass: 10000,
			designation: 'Corvette'
		},
		{
			mass: 50000,
			designation: 'Frigate'
		},
		{
			mass: 100000,
			designation: 'Destroyer'
		},
		{
			mass: 200000,
			designation: 'Heavy Destoryer'
		},
		{
			mass: 10000000,
			designation: 'Cruiser'
		},
		{
			mass: 250000,
			designation: 'Battlecruiser'
		},
		{
			mass: 500000,
			designation: 'Battleship'
		},
		{
			mass: 1000000,
			designation: 'Heavy Battleship'
		},
		{
			mass: 2500000,
			designation: 'Dreadnought'
		},
		{
			mass: 5000000,
			designatin: 'Super Dreadnought'	
		},
		{
			mass: 10000000,
			designation: 'Battle Station'
		}
	];
	for (var i = 0; i < designations.length; i++) {
		var item = designations[i];
		if (shipMass <= item.mass) {
			return item.designation;
		}
	}
	return 'Unknown';
}
 // read the class file
 // add up mass for all components
 // add percentage for other structure and standard controls
 // compute pilot or computer control
 // write out the updated class with the mass calculations
 // write out a hash file to verify the class was process and not changed
 
 