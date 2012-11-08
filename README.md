# BCS.client

A node.js implementation of a data client (consumer) for the [BCS-460 and BCS-462][ecc] brewery automation controllers. BCS.client uses the [Open Interface API][api] native to BCS devices to communicate with them over http.

## Installing

`npm install bcs.client`

## Goals & Features

One of the most difficult things about working with the BCS-46x API is the extensive amount of parsing that must be done to interpret the responses. Since the controllers make use of comma separated strings as their "format", much must be known about exactly where to look for the data that you need. One goal of this project is to abstract away all of the complexities of the device responses, and instead expose a logical tree of values ready to be accessed by path.

Another primary goal is getting data out of the device so that you can do other things with it. For instance, I have a desire to log the data from BCS sensors regardless of running processes, sensor assignments, etc. This library make that easy to do, and easy to automate. This project does not attempt to replace any of the functionality of the BCS UI. Instead, it aims to enable inter-operability with other projects, processes, and devices, by taking the pain out of communications.

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

This library follows the error, callback pattern common to node.js.

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