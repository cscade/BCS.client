// 
//  decode.js
//  BCS.client
//  
//  Copyright (c) 2012 Carson S. Christian <cc@seekerbeer.com>
//  The MIT License
// 

Number.from = Number.from || function (item) {
	var number = parseFloat(item);
	return isFinite(number) ? number : null;
};

/*
decode

Takes a raw comma-sparated file from the device, and uses the provided
dictionary options object to extract the required value.

@param {String} raw
@param {Object} options

@return {Mixed} result || null
*/
exports.decode = function (raw, options) {
	var result = null,
		segments, temp;
	
	if (typeof raw === 'string' && raw.length > 0) {
		// split the raw data
		segments = raw.split(',');
		// parse
		if (segments.length > 1) {
			try {
				// string result
				if (options.format === 'string') {
					if (options.encoding) {
						// complex decode
						if (options.encoding === 'hex') {
							// hex data type, ex mac address
							result = segments.slice(options.limits[0], (options.limits[1] || options.limits[0]) + 1).map(function (s) {
								var hex = Number.from(s).toString(16);

								if (hex.length < 2) {
									hex = '0' + hex;
								}
								return hex;
							}).join(options.join);
						} else if (options.encoding === 'multiple-choice') {
							// multiple choice, ex device model
							result = options.choices[segments.slice(options.limits[0], options.limits[0] + 1)[0]];
						}
					} else {
						// find and optionally join, as in the case of ip addresses
						result = segments.slice(options.limits[0], (options.limits[1] || options.limits[0]) + 1).join(options.join).trim();
					}
				// number result
				} else if (options.format === 'number') {
					if (options.encoding) {
						// complex decode
						if (options.encoding === 'process-state') {
							// process state
							temp = (Number.from(segments.slice(options.limits[0], options.limits[0] + 1)) >> (8 * (options.position % 4))) & 0xFF;
							if (temp === 255) {
								// process off
								result = -1;
							} else {
								// process state id
								result = temp;
							}
						} else if (options.encoding === 'temperature-10') {
							// temperature including decimal, stored as int
							result = Number.from(segments.slice(options.limits[0], options.limits[0] + 1)) / 10;
						}
					} else {
						// find and cast
						result = Number.from(segments.slice(options.limits[0], options.limits[0] + 1));
					}
				// boolean result
				} else if (options.format === 'boolean') {
					if (options.encoding) {
						// complex decode
						if (options.encoding === 'binary') {
							// decode binary string
							temp = Number.from(segments.slice(options.limits[0], options.limits[0] + 1)[0]).toString(2);
							if (options.position > temp.length - 1) {
								// resulting binary string is too short, therefore this position is false
								result = false;
							} else {
								// cast
								result = (temp[temp.length - (options.position + 1)] === '1') ? true : false;
							}
						}
					} else {
						// find and cast
						result = (segments.slice(options.limits[0], options.limits[0] + 1)[0] === '1' ? true : false);
					}
				}
			} catch (e) { return result; }
		}
	}
	return result;
};