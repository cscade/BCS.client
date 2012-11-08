// 
//  cache.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

var sys = require('sys'),
	Emitter = require('events').EventEmitter;

var Cache = function () {
	Emitter.call(this);
	this.initialize();
}
sys.inherits(Cache, Emitter);

Cache.prototype.options = {
	aggressive: true,		// Cache all structures 'aggressively', regardless of their cacheable flag
	aggressiveAge : 800,	// aggressively cached structues will expire after this age
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

Cache.prototype.initialize = function () {
	this.cache = {};
	this.stats = {
		hits: 0,
		misses: 0,
		'aggressive-expires': 0
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
	} else if (this.cacheable(structure) === false && (Date.now() - this.cache[structure].asOf) > this.options.aggressiveAge) {
		// Expire old aggressively cached structures
		delete this.cache[structure];
		this.stats.misses++;
		this.stats['aggressive-expires']++;
		return false;
	}
	this.stats.hits++;
	return true;
};

Cache.prototype.update = function (structure, response) {
	// Update the inboard cache with a new response
	this.emit('update', structure, response);
	if (!this.cacheable(structure) && this.options.aggressive !== true) return;
	this.cache[structure] = { asOf: Date.now(), value: response };
};

Cache.prototype.get = function (structure) {
	//  Return the currently cached response
	return this.cache[structure].value;
};

exports.Cache = Cache;