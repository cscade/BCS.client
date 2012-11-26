// 
//  test/device.js
//  BCS.client
//  
//  Created by Carson S. Christian on 2012-11-26.
// 

var target = {
	host: process.env.TARGET_HOST,
	port: process.env.TARGET_PORT
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
			it('should have a valid [info] property', function () {
				should.exist(device.info);
				device.info.ready.should.be.true;
				device.info.type.should.be.a('string');
				device.info.firmware.should.be.a('string');
			});
		});
		describe('of an inactive or unreachable device', function () {
			var device;
			
			before(function (done) {
				device = new Device('127.0.0.1', 80, done);
			});
			it('should have info.ready === false', function () {
				should.exist(device.info);
				device.info.ready.should.be.false;
			});
		});
	});
	describe('#read("network.currentIP")', function () {
		var device;
			
		before(function (done) {
			device = new Device(target.host, target.port, done);
		});
		it('should equal the test device ip', function (done) {
			device.read('network.currentIP', function (e, res) {
				if (e) throw e;
				res.should.equal(target.host);
				done();
			});
		});
	});
});