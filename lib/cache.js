// 
//  cache.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

/*
Cache is a read-through caching interface for the BCS device.
It will long term cache endpoints as appropriate, and also
short term cache endpoints that are volatile to rate-limit
requests to the device.

This is the primary interface through which Device instances
will talk to the BCS.

Cache is an EventEmitter:

	update: {String} endpoint name, {String} endpoint data
	 - Will be emitted whenever a endpoint has fresh response data available.
*/

var EventEmitter = require('events').EventEmitter,
	request = require('request'),
	sys = require('sys');

/*
rateLimit - in ms, the maximum rate at which volatile endpoints will be refreshed
*/
exports.rateLimit = 800;

var Cache = function (location) {
	EventEmitter.call(this);
	this.location = location;
	// endpoint type
	// static endpoints are read once, and cached indefinitely.
	// volatile endpoints are refreshed from the device if the cache is older than 800ms.
	this.endpoints = {
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

Get a endpoint, from cache, or from device. Async.

@param {String} endpoint
@param {Function} next(e, endpoint)
*/
Cache.prototype.get = function (endpoint, next) {
	var that = this;
	
	// request in process? delay the lookup
	if (this.running) return process.nextTick(function () { that.get(endpoint, next); });
	// cached copy available?
	if (this.available(endpoint)) return this.stats.bytes.read += Buffer.byteLength(this.cache[endpoint].value), next(null, this.cache[endpoint].value);
	// no cache on hand, get from device
	this.stats.requests++;
	this.running = true;
	request({
		url: 'http://' + this.location.host + ':' + (this.location.port || 80) + '/' + endpoint,
		timeout: 1000 * 5 // 5 seconds
	}, function (e, res, body) {
		that.running = false;
		if (e) return that.stats.errors++, next(e);
		that.stats.responses++
		that.stats.bytes.read += res.connection.bytesRead;
		that.stats.bytes.readThrough += res.connection.bytesRead;
		that.update(endpoint, body);
		next(null, that.cache[endpoint].value);
	});
};

/*
available

Check cache availability for a endpoint.

@param {String} endpoint

@returns {Boolean} available
*/
Cache.prototype.available = function (endpoint) {
	if (this.cache[endpoint] === undefined) return this.stats.misses++, false;
	if (!this.cacheable(endpoint) && (Date.now() - this.cache[endpoint].asOf) >= exports.rateLimit) {
		// expire old volatile endpoints
		delete this.cache[endpoint];
		return this.stats.misses++, this.stats.expires['volatile']++, false;
	}
	this.stats.hits++;
	return true;
};

/*
cacheable

Determine if a endpoint is static or volatile;

@param {String} endpoint

@return {Boolean} static
*/
Cache.prototype.cacheable = function (endpoint) {
	// Determine if a endpoint is cacheable
	return this.endpoints[endpoint] === 'static';
};

/*
update

Update the cache with a new response.

@param {String} endpoint
@param {String} response
*/
Cache.prototype.update = function (endpoint, response) {
	// Update the inboard cache with a new response
	this.cache[endpoint] = { asOf: Date.now(), value: response };
	this.emit('update', endpoint, this.cache[endpoint].value);
};

exports.Cache = Cache;