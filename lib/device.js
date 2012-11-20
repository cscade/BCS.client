// 
//  device.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

var Cache = require('./cache').Cache,
	decode = require('./decode').decode,
	dictionary = require('./dictionary').dictionary;

/*
Device

Create a new Device instance.

@param {String} host
@param {Number} port - optional
@param {Function} next(e, device.info) - optional
*/
var Device = function (host, port, next) {
	var that = this;
	
	if (typeof port === 'function') {
		next = port;
		port = undefined;
	}
	next = next || function () {};
	
	this.cache = new Cache({ host: host, port: port });
	
	this.info = { ready: false };
	this.read('system.model', function (e, device) {
		if (e && e.code !== 'ETIMEDOUT') next(e);
		if (device === 'BCS-460' || device === 'BCS-462') {
			that.info.type = device;
			that.info.ready = true;
			that.read('system.firmware', function (e, firmware) {
				if (e) return next(e);
				that.info.firmware = firmware;
				next(null, that.info);
			});
		} else if (device) {
			that.info.type = device;
			that.info.ready = false;
			that.info.error = new Error('The device at ' + host + ' reports a model of ' + device + ', which is unsupported.');
			that.info.error.code = 'EUNSUPPORTED';
			next(null, that.info);
		} else {
			that.info.ready = false;
			that.info.error = new Error('Timed out connecting to ' + host);
			that.info.error.code = 'ETIMEDOUT';
			next(null, that.info);
		}
	});
};

/*
read

Read a single path, returning the decoded value.

@param {String} path
@param {Function} next(e, result)
*/
Device.prototype.read = function (path, next) {
	var options;
	
	if (!this.info.ready && path !== 'system.model') return next(new Error('device not ready'));
	
	options = this.lookup(path);
	if (!options) return next(new Error('unknown dictionary path'));
	
	this.cache.get(options.target, function (e, structure) {
		if (e) return next(e);
		next(null, decode(structure, options));
	});
};


/*
lookup

Return the dictionary options object for a path.

@param {String} path

@returns {Mixed} dictionary.options or undefined
*/
Device.prototype.lookup = function (path) {
	var device, section, key;
	
	if (typeof path !== 'string' || path.split('.').length < 2) return;
	if (path === 'system.model' && this.info.type === undefined) return dictionary['bcs-460'].system.model;
	if (!this.info.type) return;
	path = path.split('.');
	device = this.info.type.toLowerCase();
	section = path[0];
	key = path[1];
	if (dictionary[device][section] && dictionary[device][section][key]) return dictionary[device][section][key];
	return;
};

exports.Device = Device;