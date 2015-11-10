// 
//  test/device.js
//  BCS.client
//  
//  Created by Carson S. Christian on 2012-11-26.
// 

var target = {
	host: process.env.TARGET_HOST,
	port: process.env.TARGET_PORT || 80
};

var should = require('should');

var Device = require('../lib/device').Device;

describe('Device', function () {
	describe('initialization', function () {
		describe('of an active and reachable device', function () {
			var device;
			
			before(function (done) {
				device = new Device(target.host, target.port, done);
			});
			it('should have a valid [info] object', function () {
				should.exist(device.info);
				device.info.should.have.property('build').which.is.a.String();
				device.info.should.have.property('name').which.is.a.String();
				device.info.should.have.property('ready').which.is.a.Boolean();
				device.info.should.have.property('type').which.is.a.String();
				device.info.should.have.property('version').which.is.a.String();
			});
			it('should be a BCS-460 or BCS-462', function () {
				(device.info.type === 'BCS-460' || device.info.type === 'BCS-462').should.be.true;
			});
		});
		describe('of an incorrect device address', function () {
			var device;
			
			it('should return ECONNREFUSED Error', function (done) {
				device = new Device('127.0.0.1', 80, function(e) {
					should.exist(e);
					e.should.have.property('code').which.equal('ECONNREFUSED');
					done();
				});
			});
			it('should have info.ready === false', function () {
				device.info.ready.should.be.false;
			});
		});
	});
	describe('#read("network.ip")', function () {
		var device;
			
		before(function (done) {
			device = new Device(target.host, target.port, done);
		});
		it('should equal the test device ip', function (done) {
			device.read('network', function (e, doc) {
				if (e) throw e;
				doc.ip.join('.').should.equal(target.host);
				done();
			});
		});
	});
});
