# 
#  makefile
#  BCS.client
#  
#  Created by Carson S. Christian on 2012-11-26.
# 

test-device:
	./node_modules/.bin/mocha --reporter list ./test/device.js
	
test-cache:
	./node_modules/.bin/mocha --slow 5000 --reporter list ./test/cache.js
	
test-dictionary-460:
	./node_modules/.bin/mocha --reporter list ./test/dictionary-460.js
	
test-dictionary-462:
	./node_modules/.bin/mocha --reporter list ./test/dictionary-462.js

test: test-device test-cache

.PHONY: test-device test-cache