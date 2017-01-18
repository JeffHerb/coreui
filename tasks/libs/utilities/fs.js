'use strict';

// Native Modules
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var util = require('util');

// Third party modules
var mkdirp = require('mkdirp');

// // Custom node modules
var obj = require('../utilities/object');
// var verbose = require('../utilites/verbose');

var fileSystem = function () {


	/**
     * Path Join:
     * Function that takes as many arguments as the developer wants to throw at it to create super long paths.
     *
     * Params:
     * #arguements - {string}
     * @return - {string} - copy of the full path, with the base path removed.
     **/
	var pathJoin = function _path_join() {

		var newPath = "";

		for (var prop in arguments) {

			// Check to make sure we are adding strings together.
			if (typeof(arguments[prop]) === 'string') {

                // Create the new path and unixify it just in case.
				newPath = unixifyPath(path.join(newPath, arguments[prop]));
			}

		}

		return newPath;
	};

    /**
     * Unixify Path:
     * Function takes and path string and converts it to a unix format if its on a Windows platform.
     *
     * Params:
     * path - {string} - represented desired path
     * @return - {string} - converted or original path string, depending on platform detected
     **/
    var unixifyPath = function _unixify_path(path) {

        if (process.platform === 'win32') {
            return path.replace(/\\/g, '/');
        }
        else {
            return path;
        }
    };


    /**
     * Recursive:
     * Function will recursively search a directory for look for files inside of it
     *
     * Params:
     * path - {string} - the root path that needs to be crawled
     * filters - {object} - special option used to prevent specific items from appearing in the response callback
     * @cb - {function|callback} - developers passed in function that is executed when the recursive search is finished.
     *       will return only one parameter that is an array and it will contain objects if something is found. Developers should
     *       test to ensure there are contents before attempting to iterate.
     **/
	var recursive = function _recursive(path, filters, cb) {

		// Default options
		var options = {
			shallow: false,
			filter: {
				folders: false,
				files: false
			},
            skip: {
                folders: []
            }
		}

		var sub = path;

		var walk = function (dir) {

            // Array to hold results
		    var results = [];

		    (function loopList(list) {

		    	var temp = {
		    		name: "",
		    		fullpath: "",
		    		subpath: "",
		    		ext: "",
		    		directory: false,
		    		file: false
		    	};

		    	if (list.length !== 0) {

			    	var item = list.shift();

			    	// Save the item name and full path
			    	temp.name = item;
			        temp.fullpath = pathJoin(dir, item);
			        temp.subpath = temp.fullpath.replace(sub + "/", "").replace(item, "");

			        var stat = fs.statSync(temp.fullpath);

			        if (stat && stat.isDirectory()) {

			        	// Save that the item is a directory
			        	temp.directory = true;

			        	if (!options.filter.folders) {
			        		results.push(temp);
			        	}

			        	// Check to see if we should look deep
			        	if (!options.shallow) {

                            // Do one last check to make sure this is not a folder we can safely ignore.
                            if (options.skip.folders.indexOf(temp.name) === -1) {
                                results = results.concat(walk(temp.fullpath));
                            }
			        	}


			        } else if (stat && stat.isFile()) {

			        	// Save that the item is a file
			        	temp.file = true;

			        	// Pull the extension off
			        	// Check to see if we have a period
			        	if (temp.name.indexOf('.') !== -1) {

			        		temp.ext = temp.name.substring(temp.name.lastIndexOf(".") +1);

			        	} else {

			        		// No extension?!?
			        		temp.ext = false;
			        	}

			        	if (!options.filter.files) {
			        		results.push(temp);
			        	}

			        }

			        // Check to see if we need to loop again
			        if (list.length !== 0) {
			        	loopList(list);
			        }

			    }

		    })(fs.readdirSync(dir));

		    // Return the crawl
		    return results;
		}

		// Place to save results
		var dirList = [];

		if (typeof(filters) === "object" && Object.keys(filters).length > 0) {
			options = obj.merge(options, filters);
		}

		// Call the walk function to crawl a given path.
		if (typeof(path) === "string") {

            path = this.unixifyPath(path);

			dirList = walk(path);

		}

		// Return the results
		if (cb) {
			cb(dirList);
		}
	};

    /**
     * Write Stream:
     * Function creates and returns a usable nodejs stream. This is something a developer can write
     * until they are read to write the contents to disk.
     *
     * Params:
     * k - {string} - name of the memory space buffers will be added too.
     * o - {object} - options object // No currently setup
     * @return - {object} - a native nodejs writable stream
     **/
    var writeStream = function (k, o) {

        o = {};

        // Get a copy of the node write stream
        var writer = stream.Writable;

        // Memory object space
        var mem = {};

        // Create a ustom write stream function that is used for the init.
        var writerStream = function (k, options) {

            if (!(this instanceof writerStream)) {
                return new writerStream(k, options);
            }

            writer.call(this, options);

            this.key = k;

            this.mem = mem;

            mem[k] = new Buffer('');

            this.data = function () {
                return mem[k];
            }

            this.log = function (k) {

                console.log( mem[k].toString() );
            }

        }

        // Have node inheret the properties of the native write stream
        util.inherits(writerStream, writer);

        // Override the default write stream. We need to do this so we can fouce the write stream
        // to store buffer information in an object for later use. Write is used to append data to
        // memory
        writerStream.prototype._write = function (chunk, enc, cb) {

            try {

                var buffer = (Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk, enc);

                mem[this.key] = Buffer.concat([mem[this.key], buffer]);


            } catch (e) {

                verbose.log (1, "Writer stream failed to store value", "error");
            }

            // End the current append process
            cb();

        }

        // Return the native node write function
        return new writerStream(k, o);

    }

    /**
     * Write File:
     * Function will write data contents to disk
     *
     * Params:
     * path - {string} - path where the fill should be getting written to
     * data - {Buffer|string|numbers} - data content will very, but this is the data to be written to the disk.
     * @return - {none}
     **/
    var writeFile = function (path, data) {

        path = this.unixifyPath(path);

        // Trim the filename off the path for mkdirp
        var folderpath = path.substring(0, path.lastIndexOf('/'));

        // Create the folder structure if its missing.
        mkdirp.sync(folderpath);

        // Write the files
        fs.writeFileSync(path, data);

    }

    /**
     * Write JSON:
     * This is a relay function, its only purpose is to striify a object data befor it is passed to
     * the actual write function
     *
     * Params:
     * path - {string} - path where the fill should be getting written to
     * data - {object} - JSON Object
     * @return - {none}
     **/
    var writeJSON = function (path, data) {

        var data = JSON.stringify(data, null, 4);

        this.writeFile(path, data);

    }

	return {
		pathJoin: pathJoin,
		recursive: recursive,
        unixifyPath: unixifyPath,
        writeStream: writeStream,
        writeFile: writeFile,
        writeJSON: writeJSON
	}

};

// Expor the manager function as a module
module.exports = exports = new fileSystem();
