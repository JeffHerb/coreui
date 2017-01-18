'use strict';

function object() {

	var copy = function(obj) {

		var newObj = JSON.parse(JSON.stringify(obj));

		return newObj;
	};

	var merge = function(obj1, obj2) {

	    for (var p in obj2) {

	        if (obj2.hasOwnProperty(p)) {

	            try {
	                // Property in destination object set; update its value.
	                if (obj2[p].constructor === Object) {

	                    if (obj1[p].constructor !== Object) {
	                        obj1[p] = {};
	                    }
	                    obj1[p] = this.merge(obj1[p], obj2[p]);

	                }
	                else {
	                    obj1[p] = obj2[p];
	                }

	            }
	            catch (e) {

	                // Property in destination object not set; create it and set its value.
	                obj1[p] = obj2[p];

	            }
	        }

	    }

	    return obj1;
	};

	return {
		copy: copy,
		merge: merge
	}

};

// Expor the manager function as a module
module.exports = exports = new object();