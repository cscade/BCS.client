# BCS.client

**PLEASE NOTE!** The current version of this library requires BCS firmware 4.0.0 or higher.

A node.js implementation of a data client (consumer) for the [BCS-460 and BCS-462][ecc] brewery automation controllers. BCS.client uses the [API][api-docs] native to BCS devices to communicate with them over http.

## Purpose

Long-term process logging is a primary goal for this project. This library makes that easy to do, and easy to automate. This project does not attempt to replace any of the functionality of the BCS UI, nor does it provide logging in of itself. Instead, it aims to enable inter-operability with other projects, processes, and devices by providing a robust consistent interface.

In addition to providing a simple, easy to use communications library, read-through caching has been implemented and thoroughly battle tested. This ensures that any amount of load applied to the library can be tolerated, without saturating the BCS device with HTTP requests.

#### Advantages vs. Direct API Calls

* Easily integrate real-time BCS data into any node.js application on a reachable network.
* Automatic read-through caching engine drastically reduces BCS device load while supporting theoretically unlimited simultaneous requests.
* Rate limiting ensures that even structures which must be refreshed often (like temperatures, for example) don't cause undue BCS device load.
* Wraps all device communications in node-standard, error-first callback patterns.

## Quick Start

Include the `bcs.client` module in your `package.json`, or manually install with `npm install bcs.client`.

````javascript
var Device = require('bcs.client');

var device = new Device('192.168.1.1', function (e, info) {
	
	// device info after setup
	console.log(info);
	/*
		{
		  "type": "BCS-460",
		  "version": "4.0.0",
		  "build": "c5bda61",
		  "name": "Seeker Brewing Co."
		}
	*/
	
	// get the current details of temp probe 2
	device.read('temp/2', function (e, probe) {
		console.log(probe);
		/*
			{
			  "name": "Conical B",
			  "temp": 665,
			  "setpoint": 690,
			  "resistance": 12969,
			  "enabled": true,
			  "coefficients": [
			    0.0011371546,
			    0.0002325949,
			    9.5299999999e-8
			  ]
			}
		*/
	});
	
});
````
## Methods

### new Device(hostname, [port], callback)

Returns a new `Device` instance, connected to the BCS device at the given address.

* `hostname` - ip address or host name of device
* `port` - port of device [80]
* `callback(err, info)`
	* `err` - *Error instance*, or *null/undefined*
	* `info` - device info object

### device.read(target, callback)

* `target` - endpoint you wish to read, ex. *temp/0*
* `callback(err, json)`
	* `err` - *Error instance*, or *null/undefined*
	* `json` - the endpoint json from the device

## Load Management

You can hit `device.read()` as often as you want, as hard as you want. The read-through cache will make sure the device only has to answer as many questions as absolutely needed. Here's the cache stats after a test example with 60,000 simultaneous requests, spread across 6 of the device's API read endpoints:

````javascript
// read-through cache statistics, 60k simultanous requests to 6 endpoints.
// that's a lot of bytes the device didn't need to handle!
{ hits: 59994,
  misses: 6,
  requests: 6,
  responses: 6,
  errors: 0,
  expires: { volatile: 0 },
  bytes: { read: 43210630, readThrough: 4951 } }
````

Specifically, cached results will be returned for all endpoints less than 800ms old. Anything more out-of-date than that will cause a device request. Currently the `device` and `network` endpoints are considered static, and will be cached indefinitely.
	
## Test Coverage

Clone the repository and install dev dependencies with `git clone git://github.com/cscade/BCS.client.git && cd BCS.client && npm install`.

Test coverage includes;

* `Device`
* `Cache`

To run Device and Cache tests, run `make test TARGET_HOST=192.168.1.100 TARGET_PORT=80`, substituting your BCS device's ip and port.

## License 

(The MIT License)

Copyright (c) 2012 Carson Christian &lt;cc@seekerbeer.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[ecc]: http://www.embeddedcontrolconcepts.com/ "Welcome to Embedded Control Concepts"
[api-docs]: http://www.embeddedcc.com/api-docs/ "Open Interface API - ECC Learning Center"