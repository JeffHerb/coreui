'use strict';

var request = require('request');
var async = require('async');
var fs = require('fs');
var unzip = require('unzip2');
var ufs = require('./fs');

var download = function _download () {
	// Download a collection (object) of files.
	var collection = function _collection (downloadObj, options, cb) {
		async.forEachOf(downloadObj, function (download, key, cb) {
            var requestObj = {};
            var stream;

            if (!options.proxy) {
                // No proxy so just used the URL.
                requestObj = download.url;

                console.log('Download ' + key + ': ', download.url);

                stream = request(requestObj).pipe(fs.createWriteStream(download.fullPath));

                stream.on('finish', function () {
                    if (download.fullPath.indexOf('.zip') === -1) {
                        // Not a zip, call the root calback
                        cb(null, true);
                    }
                    else {
                        var unzipDest = download.fullPath.substring(0, download.fullPath.lastIndexOf('/') + 1);

                        console.log('Unzipping ' + key + ' to:', unzipDest);

                        var archive = fs.createReadStream(download.fullPath).pipe(unzip.Extract({ path: unzipDest }));

                        archive.on('finish', function () {

                            // Check to see if this is the windows os. If not we need to make the files executable.
                            if (options.os !== 'windows') {
                                var filters = {
                                    shallow: true,
                                    filter: {
                                        folders: true,
                                    },
                                };

                                ufs.recursive(unzipDest, filters, function (fileList) {
                                    (function nextFile (files) {
                                        var fileObj = files.shift();

                                        // Ignore the zip file
                                        if (fileObj.ext !== 'zip') {
                                            fs.chmod(fileObj.fullpath, '0775', function (err) {
                                                if (err) {
                                                    console.log('Error making file executable');
                                                    cb(null, false);
                                                }
                                            });
                                        }

                                        if (files.length) {
                                            nextFile(files);
                                        }
                                        else {
                                            cb(null, true);
                                        }
                                    })(fileList);
                                });
                            }
                            else {
                                cb(null, true);
                            }
                        });
                    }
                });
            }
            else {
                if (options.proxy.auth === 'basic') {
                    // Ignore the Cert from your proxey.
                    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

                    if (options.proxy.user && options.proxy.pass) {
                        // Build the proxy string
                        var proxyUrl = 'http://' + options.proxy.user + ':' + options.proxy.pass + '@' + options.proxy.host + ':' + options.proxy.port;

                        // Merge the proxy string into a
                        requestObj = {
                            proxy: proxyUrl,
                            url: download.url,
                        };

                        console.log('Download ' + key + ': ', download.url);

                        stream = request(requestObj).pipe(fs.createWriteStream(download.fullPath));

                        stream.on('finish', function () {
                            if (download.fullPath.indexOf('.zip') === -1) {
                                // Not a zip, call the root calback
                                cb(null, true);
                            }
                            else {
                                var unzipDest = download.fullPath.substring(0, download.fullPath.lastIndexOf('/') + 1);
                                var archive = fs.createReadStream(download.fullPath).pipe(unzip.Extract({ path: unzipDest }));
                                console.log('unzipping ' + key + ' to:', unzipDest);

                                archive.on('finish', function () {
                                    // Check to see if this is the windows os. If not we need to make the files executable.
                                    if (options.os !== 'windows') {
                                        var filters = {
                                            shallow: true,
                                            filter: {
                                                folders: true,
                                            },
                                        };

                                        ufs.recursive(unzipDest, filters, function (fileList) {
                                            (function nextFile (files) {
                                                var fileObj = files.shift();

                                                // Ignore the zip file
                                                if (fileObj.ext !== 'zip') {
                                                    fs.chmod(fileObj.fullpath, '0775', function (err) {
                                                        if (err) {
                                                            console.log('Error making file executable');
                                                            cb(null, false);
                                                        }
                                                    });
                                                }

                                                if (files.length) {
                                                    nextFile(files);
                                                }
                                                else {
                                                    cb(null, true);
                                                }
                                            })(fileList);
                                        });
                                    }
                                    else {
                                        cb(null, true);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        console.log('Both a username and a password must be provided to use a basic proxy.');
                    }
                }
            }
		}, function (err) {
			if (err) {
				console.log('Download failed.');
				cb(false);
			}

			cb(true);
		});
	};

	return {
		collection: collection,
	};
};

// Export the manager function as a module
module.exports = exports = new download();
