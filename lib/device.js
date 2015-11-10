// 
//  device.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

var Cache = require('./cache').Cache;

/*
Device

Create a new Device instance.

@param {String} host
@param {Number} port - optional
@param {Function} next(e, deviceDocument) - optional
*/
var Device = function (host, port, next) {
	var device = this;
	
	if (typeof port === 'function') {
		next = port;
		port = undefined;
	}
	next = next || function () {};
	
	this.cache = new Cache({ host: host, port: port });
	
	this.info = { ready: false };
	this.read('device', function (e, json) {
		// Unhandled exception, return raw error.
		if (e && e.code !== 'ETIMEDOUT' && e.code !== 'EJSONPARSE') return next(e);
		// Handled conditions;
		if (e && e.code === 'ETIMEDOUT') {
			// Connection timeout.
			device.info.ready = false;
			device.info.error = new Error('Timed out connecting to ' + host);
			device.info.error.code = 'ETIMEDOUT';
			next(null, device.info);
		} else if (e && e.code === 'EJSONPARSE') {
			// Unparseable response.
			device.info.ready = false;
			device.info.error = e;
			next(null, device.info);
		} else if (json.type === 'BCS-460' || json.type === 'BCS-462') {
			// Supported device version.
			device.info.build = json.build;
			device.info.name = json.name;
			device.info.ready = true;
			device.info.type = json.type;
			device.info.version = json.version;
			next(null, device.info);
		} else if (json) {
			// Unsupported device version.
			device.info.type = json.type;
			device.info.ready = false;
			device.info.error = new Error('The device at ' + host + ' reports a type of ' + json.type + ', which is unsupported');
			device.info.error.code = 'EUNSUPPORTED';
			next(null, device.info);
		}
	});
};

/*
read

Read a single endpoint, returning the response.

@param {String} endpoint
@param {Function} next(e, resultJSON)
*/
Device.prototype.read = function (endpoint, next) {
	if (!this.info.ready && endpoint !== 'device') return next(new Error('device not ready'));
	this.cache.get(endpoint, function(e, response) {
		var error;
		var json;

		if (e) return next(e);
		try {
			json = JSON.parse(response);
		} catch (err) {
			error = new Error('Device response could not be parsed by JSON.parse()');
			error.code = 'EJSONPARSE';
			return next(error);
		}
		return next(null, json);
	});
};

exports.Device = Device;