// 
//  cache.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

/*
Cache is a read-through caching interface for the BCS device.
It will long term cache structures as appropriate, and also
short term cache structures that are volatile to rate-limit
requests to the device.

This is the primary interface through which Device instances
will talk to the BCS.

Cache is an EventEmitter:

	update: {String} structure name, {String} device response
	 - Will be emitted whenever a structure has fresh response data available.
*/

var EventEmitter = require('events').EventEmitter,
	request = require('request'),
	sys = require('sys');

/*
rateLimit - in ms, the maximum rate at which volatile structures will be refreshed
*/
exports.rateLimit = 800;

var Cache = function (location) {
	EventEmitter.call(this);
	this.location = location;
	// structure type
	// static structures are read once, and cached indefinitely.
	// volatile structures are refreshed from the device if the cache is older than 800ms.
	this.structures = {
		'sysname.dat': 'static',
		'ipaddr.dat': 'static',
		'ultemp.dat': 'volatile',
		'ulsysio.dat': 'volatile',
		'ucsysio.dat': 'volatile',
		'enetlog.dat': 'volatile',
	};
	// cache
	this.cache = {};
	// stats
	this.stats = {
		hits: 0,
		misses: 0,
		requests: 0,
		responses: 0,
		errors: 0,
		expires: {
			'volatile': 0
		},
		bytes: {
			read: 0,
			readThrough: 0
		}
	};
}
sys.inherits(Cache, EventEmitter);

/*
get

Get a structure, from cache, or from device. Async.

@param {String} structure
@param {Function} next(e, structure)
*/
Cache.prototype.get = function (structure, next) {
	var that = this;
	
	// request in process? delay the lookup
	if (this.running) return process.nextTick(function () { that.get(structure, next); });
	// cached copy available?
	if (this.available(structure)) return this.stats.bytes.read += Buffer.byteLength(this.cache[structure].value), next(null, this.cache[structure].value);
	// no cache on hand, get from device
	this.stats.requests++;
	this.running = true;
	request('http://' + this.location.host + ':' + (this.location.port || 80) + '/' + structure, function (e, res, body) {
		that.running = false;
		if (e) return that.stats.errors++, next(e);
		that.stats.responses++
		that.stats.bytes.read += res.connection.bytesRead;
		that.stats.bytes.readThrough += res.connection.bytesRead;
		that.update(structure, body);
		next(null, that.cache[structure].value);
	});
};

/*
available

Check cache availability for a structure.

@param {String} structure

@returns {Boolean} available
*/
Cache.prototype.available = function (structure) {
	if (this.cache[structure] === undefined) return this.stats.misses++, false;
	if (!this.cacheable(structure) && (Date.now() - this.cache[structure].asOf) >= exports.rateLimit) {
		// expire old volatile structures
		delete this.cache[structure];
		return this.stats.misses++, this.stats.expires['volatile']++, false;
	}
	this.stats.hits++;
	return true;
};

/*
cacheable

Determine if a structure is static or volatile;

@param {String} structure

@return {Boolean} static
*/
Cache.prototype.cacheable = function (structure) {
	// Determine if a structure is cacheable
	return this.structures[structure] === 'static';
};

/*
update

Update the cache with a new response.

@param {String} structure
@param {String} response
*/
Cache.prototype.update = function (structure, response) {
	// Update the inboard cache with a new response
	this.cache[structure] = { asOf: Date.now(), value: response };
	this.emit('update', structure, this.cache[structure].value);
};

exports.Cache = Cache;