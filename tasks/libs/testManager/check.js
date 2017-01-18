'use strict';

var os = require('os');
var net = require('net');
var spawn = require('child_process').spawn;

var mkdirps = require('mkdirps');
var async = require('async');

var fs = require('../utilities/fs');
var download = require('../utilities/download');

var _priv = {};

// Function will pull additional platform information used to determine what can and cant be downloaded.
_priv.discoverPlatform = function _discover_platform(options) {

    // Pull down the system Architecture
    options.system.arch = os.arch();

    switch (os.platform()) {

        case 'darwin':

            options.system.os = 'mac';
            break;

        case 'win32':

            options.system.os = 'windows';
            break;

        default:

            options.system.os = 'unix';
            break;
    }

    // If this is not a windows system, remove any referance to IE driver support.
    if (options.system.os !== 'windows') {

        if (options.selenium.drivers.ie) {

            delete options.selenium.drivers.ie;
        }
    }

    return options;
};

_priv.portInUse = function _port_in_use (port, cb) {
    var server = net.createServer(function (socket) {
        socket.write('Echo server\r\n');
        socket.pipe(socket);
    });

    server.listen(port, '127.0.0.1');

    server.on('error', function (e) {
        cb(null, false);
    });

    server.on('listening', function (e) {
        server.close();
        cb(null, true);
    });
};

_priv.javaCheck = function _java_check (cb) {
    // Spawn a java instance
    var java = spawn('java', ['-version']);

    var dataReceived = false;

    java.on('error', function (err) {
        // Error occured block the process
        console.log('An error occured when checking if Java was installed');
        cb(true);
    });

    java.stderr.on('data', function (data) {
        if (data !== false) {
            // Hook to prevent multiple calls
            if (!dataReceived) {
                dataReceived = true;

                // Kill this java process
                java.kill('SIGINT');

                // All green
                cb(null, true);
            }
        }
        else {
            // Java is not installed
            console.log('Something is not right, is Java installed on this machine?');
            cb(null, false);
        }
    });
};

var check = function _check() {
    // Check to see if the desired files are in place first.
    var files = function _selenium(grunt, options, cb) {
        // Start by discovering the users platform
        options = _priv.discoverPlatform(options);

        // Get the name of the drivers
        var drivers = Object.keys(options.selenium.drivers);

        // Get all the array
        var installTypes = drivers.concat(['server']);

        var downloads = {};

        // Loop throigh and construct and object of all the proper names and paths
        for (var i = 0, len = installTypes.length; i < len; i++) {
            downloads[installTypes[i]] = {};

            if (installTypes[i] !== 'server') {

                // Create a base path with the driver in its own folder
                downloads[installTypes[i]].basePath = fs.pathJoin(options.selenium.basePath, installTypes[i]);

                // Cunstruct the filename based on the naming pattern chosen by the selenium writers
                if (installTypes[i] === 'chrome') {

                    switch (options.system.os) {
                        case 'windows':
                            downloads[installTypes[i]].filename = options.selenium.drivers[installTypes[i]].file + 'win32' + options.selenium.drivers[installTypes[i]].ext;

                            break;

                        case 'mac':
                            downloads[installTypes[i]].filename = options.selenium.drivers[installTypes[i]].file + 'mac64' + options.selenium.drivers[installTypes[i]].ext;

                            break;

                        default:
                            if (options.system.arch === 'ia32') {
                                downloads[installTypes[i]].filename = options.selenium.drivers[installTypes[i]].file + 'linux32' + options.selenium.drivers[installTypes[i]].ext;
                            }
                            else {
                                downloads[installTypes[i]].filename = options.selenium.drivers[installTypes[i]].file + 'linux64' + options.selenium.drivers[installTypes[i]].ext;
                            }

                            break;
                    }

                }
                else if (installTypes[i] === 'ie') {
                    if (options.system.arch === 'ia32') {
                        downloads[installTypes[i]].filename = options.selenium.drivers[installTypes[i]].file + 'Win32_' + options.selenium.drivers[installTypes[i]].version + options.selenium.drivers[installTypes[i]].ext;
                    }
                    else {
                        downloads[installTypes[i]].filename = options.selenium.drivers[installTypes[i]].file + 'x64_' + options.selenium.drivers[installTypes[i]].version + options.selenium.drivers[installTypes[i]].ext;
                    }
                }

                // Create the URL based on the path defined by the driver type, since not all drivers share a common stucture we need to write them out seperately.....

                // Create the URL path
                switch (installTypes[i]) {
                    case 'chrome':
                        downloads[installTypes[i]].url = options.selenium.drivers[installTypes[i]].url + options.selenium.drivers[installTypes[i]].version + '/' + downloads[installTypes[i]].filename;

                        break;

                    // http://selenium-release.storage.googleapis.com/2.53/IEDriverServer_Win32_2.53.0.zip
                    case 'ie':
                        downloads[installTypes[i]].url = options.selenium.drivers[installTypes[i]].url + options.selenium.drivers[installTypes[i]].version.substring(0, options.selenium.drivers[installTypes[i]].version.lastIndexOf('.')) + '/' + downloads[installTypes[i]].filename;

                        break;
                }

                downloads[installTypes[i]].file = options.selenium.drivers[installTypes[i]].file.replace('_', '');
            }
            else {
                // Pull out the path
                downloads[installTypes[i]].basePath = options.selenium.basePath;
                downloads[installTypes[i]].filename = options.selenium.server.file + options.selenium.server.version + options.selenium.server.ext;
                downloads[installTypes[i]].url = options.selenium.server.url + options.selenium.server.version.substring(0, options.selenium.server.version.lastIndexOf('.')) + '/' + downloads[installTypes[i]].filename;
            }

            // Create the full path for later check and reference
            downloads[installTypes[i]].fullPath = fs.pathJoin(downloads[installTypes[i]].basePath, downloads[installTypes[i]].filename);

            if (installTypes[i] !== 'server') {
                // Update the options so we have full references late
                options.selenium.drivers[installTypes[i]] = downloads[installTypes[i]];
            }
            else {
                options.selenium.server = downloads[installTypes[i]];
            }

        }

        var newDirectories = [];

        // Now loop through out new loop object and filter out the installs paths and files that exist
        for (var file in downloads) {
            if (!grunt.file.isDir(downloads[file].basePath) || !grunt.file.exists(downloads[file].fullPath)) {

                // Check again to see if the directory was missing,
                if (!grunt.file.isDir(downloads[file].basePath)) {
                    newDirectories.push(downloads[file].basePath);
                }
            }
            else {
                // We dont need to do anything here remove this object.
                delete downloads[file];
            }
        }

        // Check to see if the directories have length
        if (newDirectories.length) {
            mkdirps(newDirectories, function (err) {
                if (err) {
                    cb(false);
                }

                if (Object.keys(downloads).length > 0) {
                    download.collection(downloads, options, function () {
                        cb(true);
                    });
                }
                else {
                    // We have nothing to do!
                    cb(true);
                }
            });
        }
        else {
            if (Object.keys(downloads).length > 0) {
                download.collection(downloads, options, function () {

                    cb(true);
                });
            }
            else {
                // We have nothing to do!
                cb(true);
            }
        }
    };

    // Check to see if a service is already running.
    var port = function _service (grunt, options, cb) {
        if (options.testMode === 'local') {
            async.series([_priv.portInUse.bind(null, options.selenium.port)], function (err, results) {
                if (err || !results[0]) {
                    cb(false);
                }
                cb(true);
            });
        }
    };

    // Check to see that java is installed on the local machine
    var java = function _java (cb) {
        _priv.javaCheck(function (error, results) {
            if (!error && results) {
                cb(true);
            }
            else {
                cb(false);
            }
        });
    };

    return {
        files: files,
        java: java,
        port: port,
    };
};

// Export the manager function as a module
module.exports = exports = new check();
