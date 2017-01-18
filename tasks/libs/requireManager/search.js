'use strict';

var fs = require('../utilities/fs');

var _priv = {};

_priv.searchDist = function _search_dist (distPath, cb) {

    var searchOptions = {
        filter: {
            folders: true,
        },
        skip: {
            folders: [
                'docs',
                'tests',
                'tests-old',
            ],
        },
    };

    fs.recursive(distPath, searchOptions, function (fileList) {
        var processFiles = [];

        if (fileList.length !== 0) {
            (function nextFile (fileList) {
                var file = fileList.shift();

                // Remove unneeded demo
                delete file.subpath;
                delete file.directory;
                delete file.file;

                // Push file onto the list
                processFiles.push(file);

                if (fileList.length !== 0) {

                    nextFile(fileList);
                }
                else {

                    // Return process files if any are found
                    if (processFiles.length !== 0) {
                        cb(processFiles);
                    }
                    else {
                        cb(false);
                    }

                }

            })(fileList.concat());
        }
        else {
            cb(false);
        }
    });
};

var search = function _search () {
    var files = function _files (rm, next) {

        console.log("Got to search");

        var options = rm.options;

        var components = Object.keys(options.components);

        (function nextComponent (components) {
            var componentName = components.shift();
            var componentDef = rm.options.components[componentName];

            // Check to see if the component even has a build process
            if (componentDef.build !== false) {
                var distPath = fs.pathJoin(componentDef.fullpath, 'dist');

                // Lets search the component folder.
                _priv.searchDist(distPath, function(fileList) {
                    componentDef.distFiles = fileList;
                });
            }
            else {
                // There is no build process so make a copy of the sourceFiles attribute to mimic the buildable components
                componentDef.distFiles = componentDef.sourceFiles;
            }

            // Add the dist files to the component definition
            rm.options.components[componentName] = componentDef;

            if (components.length !== 0) {
                nextComponent(components);
            }
            else {
                next(rm);
            }
        })(components);
    };

    return {
        files: files,
    };
};

// Export the manager function as a module
module.exports = exports = new search();
