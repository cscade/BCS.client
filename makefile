# 
#  makefile
#  BCS.client
#  
#  Created by Carson S. Christian on 2012-11-26.
# 

test-device:
	./node_modules/.bin/mocha --reporter spec ./test/device.js
	
test-cache:
	./node_modules/.bin/mocha --reporter spec ./test/cache.js

test: test-device test-cache

.PHONY: test-device test-cache