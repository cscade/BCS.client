# BCS.client

A node.js implementation of a data client (consumer) for the [BCS-460 and BCS-462][ecc] brewery automation controllers. BCS.client uses the [Open Interface API][api] native to BCS devices to communicate with them over http.

## Installing

`npm install bcs.client`

## Goals & Features

One of the most difficult things about working with the BCS-46x API is the extensive amount of parsing that must be done to interpret the responses. Since the controllers make use of comma separated strings as their "format", much must be known about exactly where to look for the data that you need. One goal of this project is to abstract away all of the complexities of the device responses, and instead expose a logical tree of values ready to be accessed by path.

Another primary goal is getting data out of the device so that you can do other things with it. For instance, I have a desire to log the data from BCS sensors regardless of running processes, sensor assignments, etc. This library makes that easy to do, and easy to automate. This project does not attempt to replace any of the functionality of the BCS UI. Instead, it aims to enable inter-operability with other projects, processes, and devices, by taking the pain out of communications.

Note that I only have a BCS-460 to test against. If you use this library with a 462 and have any issues, please let me know.

#### Features

* Integrate real-time BCS data into any node.js application on the same network.
* Read structures without knowing (or caring) how to get at them through the native API. It's a simple as `device.read('temp.value0')`.
* Automatic read-through caching engine drastically reduces BCS device load while supporting unlimited simultaneous requests.
* Rate limiting ensures that even structures which must be refreshed often (like temperatures, for example) don't cause undue BCS device load.

## Using

Include the module in your `package.json`, or manually install with `npm install bcs.client`.

````javascript
var Device = require('bcs.client');

var device = new Device('192.168.1.1', function (e, state) {
	
	// device state after setup
	console.log(state);
	
	// get the name of temp probe 2
	device.read('temp.name2', function (e, name) {
		console.log(name);
	});
	
	// get the value of temp probe 2
	device.read('temp.value2', function (e, temp) {
		console.log(temp);
	});
	
});
````

Yields;

	{ ready: true, type: 'BCS-460', firmware: 'BCS-460 v3.4.5' }
	Conical
	58.3

#### Load Management

This library follows the `error, callback` pattern common to node.js.

You can hit `device.read()` as often as you want, as hard as you want. The read-through cache will make sure the device only has to answer as many questions as absolutely needed. Here's the cache stats after a test example with 60,000 simultaneous requests, spread across all 6 of the device's API read endpoints:

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

## Dictionary Support

Any item in the dictionary can be used with `device.read`. ex. `device.read('ps0.state')` or `device.read('output.status0')`.

The built in dictionary currently supports all the following API paths for reading, both for the BCS-460 & 462;

* processes 0-7, ex `ps0`
	* name, ex `ps0.name == 'Process 1'`
	* status, ex `ps0.status == true || false`
	* state *current*, ex `ps0.state == 0`
	* state 0-7, ex `ps0.state0 === "State 1"`
	* win 0-3, ex `ps0.win0 === "Button 1"`
	* timer 0-3, ex `ps0.timer0 === "Timer 1"`
* temps 0-4 *(460)*, 0-8 *(462)*, ex `temp`
	* name, ex `temp.name0 == "Probe Number One"`
	* value, ex `temp.value0 == 147.5`
	* setpoint, ex `temp.setpoint0 == 150`
* inputs 0-3 *(460)*, 0-7 *(462)*, ex `input`
	* name, ex `input.name0 == "Input Number One"`
	* status, ex `input.status0 == true || false`
* outputs 0-5 *(460)*, 0-17 *(462)*, ex `output`
	* name, ex `output.name0 == "Output Number One"`
	* status, ex `output.status0 == true || false`
* `network`
	* `network.staticAddress`
	* `network.subnetMask`
	* `network.gateway`
	* `network.MAC`
	* `network.currentIP`
	* `network.DHCPEnabled`
	* `network.packetsSent`
	* `network.packetsReceived`
* `system`
	* `system.model == "BCS-460" || "BCS-462"`
	* `system.fimware` ex `"BCS-460 v3.4.5"`

### License 

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
[api]: http://wiki.embeddedcc.com/index.php?title=Open_Interface_API "Open Interface API - ECC Learning Center"