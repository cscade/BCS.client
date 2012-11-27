// 
//  test/cache.js
//  BCS.client
//  
//  Created by Carson S. Christian on 2012-11-26.
// 

var target = {
	host: process.env.TARGET_HOST,
	port: process.env.TARGET_PORT
};

var should = require('should');

var Cache = require('../lib/cache').Cache;

describe('Cache', function () {
	var cache = new Cache({ host: target.host, port: target.port });
	
	it('should expose its host and port', function () {
		should.exist(cache.location);
		cache.location.host.should.equal(target.host);
		cache.location.port.should.equal(target.port);
	});
	describe('multiple structure requests', function () {
		this.timeout(10000);
		beforeEach(function () {
			cache = new Cache({ host: target.host, port: target.port });
		});
		afterEach(function () {
			cache.stats.errors.should.equal(0);
		});
		// static (non-volatile) structures
		['sysname.dat', 'ipaddr.dat'].forEach(function (struct) {
			describe('to ' + struct, function () {
				it('should not cause multiple device requests', function (done) {
					cache.get(struct, function (e, data) {
						if (e) throw e;
						setTimeout(function () {
							cache.get(struct, function (e, data) {
								if (e) throw e;
								cache.stats.hits.should.equal(1);
								cache.stats.misses.should.equal(1);
								cache.stats.expires.volatile.should.equal(0);
								done();
							});
						}, 2000);
					});
				});
			});
		});
		// volatile structures
		['ultemp.dat', 'ulsysio.dat', 'ucsysio.dat', 'enetlog.dat'].forEach(function (struct) {
			describe('to ' + struct, function () {
				it('should cause multiple device requests', function (done) {
					cache.get(struct, function (e, data) {
						if (e) throw e;
						setTimeout(function () {
							cache.get(struct, function (e, data) {
								if (e) throw e;
								cache.stats.hits.should.equal(0);
								cache.stats.misses.should.equal(2);
								cache.stats.expires.volatile.should.equal(1);
								done();
							});
						}, 1000);
					});
				});
			});
		});
	});
});
