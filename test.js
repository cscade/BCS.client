// 
//  device_test.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

var Cache = require('./lib/cache').Cache,
	Device = require('./lib/device').Device;

var tests = [
	function () {
		var cache = new Cache({ host: '192.168.42.2' });
		var structures = {
				'sysname.dat': 'static',
				'ipaddr.dat': 'static',
				'ultemp.dat': 'volatile',
				'ulsysio.dat': 'volatile',
				'ucsysio.dat': 'volatile',
				'enetlog.dat': 'volatile',
			}, done = 0;
		
		console.log('*** START: Test read-through on all structures');
		Object.keys(structures).forEach(function (struct) {
			var iterations = 10000;
	
			structures[struct] = { responses: 0 };
			for (var i = 1; i <= iterations; i++) {
				cache.get(struct, function (e, data) {
					structures[struct].responses++;
					if (e) console.log(struct, e);
					if (iterations === structures[struct].responses) {
						done++;
						console.log('done', struct);
					}
					if (done === Object.keys(structures).length) {
						console.log(structures);
						console.log(cache.stats);
						console.log('*** COMPLETE: Test read-through on all structures');
						(tests.shift() || function () {})();
					}
				});
			}
		});
	},
	function () {
		var device;
		
		console.log('*** START: Device initialization test');
		device = new Device('192.168.42.2', 80, function (e, state) {
			console.log(e, state);
			console.log('*** COMPLETE: Device initialization test');
		});
	},
];

tests.shift()();