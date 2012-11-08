// 
//  cache.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

var EventEmitter = require('events').EventEmitter,
	extend = require('xtend'),
	sys = require('sys');

var Cache = function () {
	EventEmitter.call(this);
	this.initialize();
}
sys.inherits(Cache, EventEmitter);

Cache.prototype.initialize = function (options) {
	// set options
	this.options = {
		cacheable: {
			'sysname.dat': 	true,
			'ipaddr.dat': 	true,
			'ultemp.dat': 	false,
			'ulsysio.dat': 	false,
			'ucsysio.dat': 	false,
			'enetlog.dat': 	false
		}
		// onUpdate: function (structure, data) {} Fires whenever a new copy of a structure becomes available, regardless of it's cacheability
	};
	extend(this.options, options || {});
	// cache
	this.cache = {};
	// stats
	this.stats = {
		hits: 0,
		misses: 0,
		expires: {
			aggressive: 0
		}
	};
};

Cache.prototype.cacheable = function (structure) {
	// Determine if a structure is cacheable
	return this.options.cacheable[structure] === true;
};

Cache.prototype.check = function (structure) {
	// Return bool indicating cache availability for a structure
	if (this.cache[structure] === undefined) {
		this.stats.misses++;
		return false;
	} else if (!this.cacheable(structure) && (Date.now() - this.cache[structure].asOf) > 800) {
		// Expire old aggressively cached structures
		delete this.cache[structure];
		this.stats.misses++;
		this.stats.expires.aggressive++;
		return false;
	}
	this.stats.hits++;
	return true;
};

Cache.prototype.update = function (structure, response) {
	// Update the inboard cache with a new response
	this.emit('update', structure, response);
	this.cache[structure] = { asOf: Date.now(), value: response };
};

Cache.prototype.get = function (structure) {
	//  Return the currently cached response
	return this.cache[structure].value;
};

exports.Cache = Cache;