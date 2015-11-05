// 
//  test/dictionary-462.js
//  BCS.client
//  
//  Created by Carson S. Christian on 2012-11-26.
// 

var target = {
	host: process.env.TARGET_HOST,
	port: process.env.TARGET_PORT || 80
};

var should = require('should');

var Device = require('../lib/device').Device,
	dictionary = require('../lib/dictionary-462');

describe('Dictionary', function () {
	var device;
	
	before(function (done) {
		device = new Device(target.host, target.port, done);
	});
	describe('for the BCS-462', function () {
		Object.keys(dictionary).forEach(function (section) {
			describe('section "' + section + '"', function () {
				Object.keys(dictionary[section]).forEach(function (key) {
					it('should return "' + key + '" as a ' + dictionary[section][key].format, function (done) {
						device.read(section + '.' + key, function (e, response) {
							if (e) throw e;
							should.exist(response);
							response.should.be.a(dictionary[section][key].format);
							console.log(response);
							done();
						});
					});
				});
			});
		});
	});
});
