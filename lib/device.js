// 
//  device.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

var sys = require('sys'),
	Emitter = require('events').EventEmitter,
	http = require('http'),
	$dictionary = require('./Dictionary'),
	Cache = require('./Cache'),
	decode = require('./Decode');

function BCS (location, callback) {
	if (false === (this instanceof BCS)) {
		return new BCS(location, callback);
	}
	Emitter.call(this);
	this.initialize(location, callback);
}
sys.inherits(BCS, Emitter);

BCS.prototype.initialize = function (location, callback) {
	var that = this;
	
	this.device = {
		location: location,
		type: null,
		firmware: null,
		ready: false,
		totalResponses: 0,
		lookingUp: []
	};
	this.listeners = {};
	this.cache = new Cache();
	this.cache.on('update', function (structure, data) {
		// Update all listeners with new data
		if (that.listeners[structure] !== undefined) {
			that.listeners[structure].forEach(function (c) { c(data); });
			that.removeUpdateListeners(structure);
		}
	});
	this.idController(callback);
};

BCS.prototype.idController = function (callback) {
	// Id the controller type we are connecting to
	var that = this;
	
	if (callback === undefined) {
		callback = function () {};
	}
	this.read('system.model', function (r) {
		var key;
		
		if (r !== null) {
			if (r === 'BCS-460' || r === 'BCS-462') {
				that.device.type = r;
				that.device.ready = true;
				that.read('system.firmware', function (f) {
					that.device.firmware = f;
					callback();
				});
			} else {
				console.log('The device at ' + that.device.location + ' reports a model of ' + r + ', which is unsupported.');
				that.device.type = r;
				that.device.ready = false;
				callback(false);
			}
		} else {
			console.log('Communication failed with the BCS device at ' + that.device.location);
			that.device.type = null;
			that.device.ready = false;
			callback(false);
		}
	});
};

BCS.prototype.read = function (path, callback, notify) {
	// Read a value from the device
	if (typeof path === 'string') {
		this.readOne(path, callback, notify);
	} else if (typeof path.forEach === 'function') {
		this.readMany(path, callback);
	}
};

BCS.prototype.readOne = function (path, callback) {
	// Return the requested value for the key in section to the callback function provided.
	var options, structure, request, responseString = '',
		that = this;
	
	if (this.device.ready === false && path !== 'system.model') {
		// Any requests prior to determining model should be ignored
		callback(false);
		return;
	}
	options = this.findDictionaryOptions(path);
	if (!options) {
		callback(null);
		return;
	}
	structure = options.target;
	if (this.cache && this.cache.check(structure)) {
		callback(decode(this.cache.get(structure), options));
		return;
	}
	request = {
		host: this.device.location,
		port: 80,
		path: '/' + structure
	};
	if (this.device.lookingUp.indexOf(structure) === -1) {
		// Generate a new request
		this.device.lookingUp.push(structure);
		http.get(request, function (r) {
			r.setEncoding('utf8');
			r.on('data', function (chunk) {
				responseString = responseString + chunk;
			});
			r.on('end', function () {
				that.device.lookingUp.splice(that.device.lookingUp.indexOf(structure), 1);
				that.device.totalResponses += 1;
				if (that.cache) {
					that.cache.update(structure, responseString);
				}
				callback(decode(responseString, options));
			});
		}).on('error', function (e) {
			that.device.lookingUp.splice(that.device.lookingUp.indexOf(structure), 1);
			callback(null);
		});
	} else {
		// Listen on existing request
		that.addUpdateListener(structure, function (data) {
			callback(decode(data, options));
		});
	}
};

BCS.prototype.readMany = function (paths, callback) {
	// Convenience method to return many responses at once
	// Returns an array of responses in the same order as the paths requested
	var responses = 0,
		that = this;
	
	paths.forEach(function (path, index) {
		that.readOne(path, function (response) {
			paths[index] = response;
			responses += 1;
			if (responses === paths.length) {
				callback(paths);
			}
		});
	});
};

BCS.prototype.findDictionaryOptions = function (path) {
	// Locate the dictionary options section for the given path
	var section, key, options;
	
	if (typeof path !== 'string' || path.split('.').length < 2) {
		return false;
	} else {
		section = path.split('.')[0];
		key = path.split('.')[1];
		if (path === 'system.model' && this.device.type === undefined) {
			// Device type has not yet been detected.
			return $dictionary['460'].system.model;
		} else if (this.device.type !== undefined) {
			if ($dictionary['460'][section] !== undefined && $dictionary['460'][section][key] !== undefined) {
				return $dictionary['460'][section][key];
			} else if (this.device.type === 'BCS-462') {
				if ($dictionary['462'][section] !== undefined && $dictionary['462'][section][key] !== undefined) {
					return $dictionary['462'][section][key];
				}
			}
		}
	}
	return false;
};

BCS.prototype.addUpdateListener = function (structure, callback) {
	// callback will be registered to be called whenever the structure is updated.
	if (this.listeners[structure] === undefined) {
		this.listeners[structure] = [];
	}
	if (this.listeners[structure].indexOf(callback) === -1) {
		this.listeners[structure].push(callback);
	}
};

BCS.prototype.removeUpdateListeners = function (structure) {
	// Remove all listeners for a structure
	this.listeners[structure] = undefined;
};

BCS.prototype.reconnect = function (callback) {
	// Attempt to reconnect to a lost controller
	this.idController(callback);
};

BCS.prototype.processToggle = function (id, callback) {
	// Toggle the given process
	var request;
	
	request = {
		host: this.device.location,
		port: 80,
		path: '/uinputp.dat?proc=' + id
	};
	http.get(request, function (r) {
		r.on('end', function () {
			callback();
		});
	}).on('error', function (e) {
		callback();
	});
};

module.exports = BCS;