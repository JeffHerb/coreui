'use strict';

var _priv = {};

_priv.addTaskType = function _add_task_type(task, grunt) {

    switch (task) {

        case 'uglify':

            // Uglify is not a default task, so lets make sure that its created first
            var uglifyObj = grunt.config.get('uglify');

            var jsBanner = grunt.config.get('jsBanner');

            if (uglifyObj === undefined || uglifyObj === null) {

                uglifyObj = {
                    options: {
                        banner: jsBanner,
                        preserveComments: false, // Only comments with a special syntax are kept
                        sourceMap: false,
                        mangle: false,
                    }
                };

                grunt.config.set('uglify', uglifyObj);
            }

            return uglifyObj;

        case 'cssmin':

            // Uglify is not a default task, so lets make sure that its created first
            var cssminObj = grunt.config.get('cssmin');

            var cssBanner = grunt.config.get('cssBanner');

            if (cssminObj === undefined || cssminObj === null) {

                cssminObj = {
                    options: {
                        banner: cssBanner,
                        roundingPrecision: -1,
                        sourceMap: false
                    }
                };

                grunt.config.set('cssmin', cssminObj);
            }

            return cssminObj;

        default:
            console.log('Error: Unkown task type requested: ' + task);

            break;
    }

    return false;
};

var process = function _process () {

    var components = function _components (rm, next) {

        console.log("Got to process");

        var options = rm.options;
        var grunt = rm.grunt;
        var global = {};

        rm.options.lazyPaths = {};

        (function nextComponent (components) {
            var componentName = components.shift();
            var componentDef = rm.options.components[componentName];

            // Check to see if this is a lazy or a include task
            var processor = require('./processor/' + componentDef.includeMethod);

            if (componentDef.settings && componentDef.settings.registerFiles) {

                if (!rm.options.registerFiles) {
                    rm.options.registerFiles = {};
                }

                for (var file in componentDef.settings.registerFiles) {

                    if (!rm.options.registerFiles.hasOwnProperty(file)) {

                        rm.options.registerFiles[file] = componentDef.settings.registerFiles[file];
                    }

                }

            }

            // Execute component processor
            processor.component(componentDef, grunt, global, function(resultObject) {
                if (resultObject !== false) {
                    // Check for key returns...

                    // Loop through the returned results looking for key actions
                    var resultKeys = Object.keys(resultObject);

                    // Sketchy fix for now as we have more important fixes to too.... JH 1/4/2017
                    if (componentName === "pageScripts") {

                        if (resultObject.gruntTasks.hasOwnProperty('pageScripts_dist-task_scripts')) {

                            resultObject.gruntTasks['pageScripts_dist-task_scripts'].files = [
                                {
                                    "expand": true,
                                    "dest": "dist/js/scripts",
                                    "filter": "isFile",
                                    "cwd": "src/project/components/pageScripts/dist/js/",
                                    "src": [
                                        "**/*.*"
                                    ]
                                }
                            ];
                        }
                    }

                    (function nextKey(keys) {
                        var key = keys.shift();

                        switch (key) {
                            case 'map':
                                (function nextMappedTask (mapped) {
                                    var map = mapped.shift();
                                    var gruntConfigType = grunt.config.get(map);

                                    if (gruntConfigType === undefined || gruntConfigType === null) {
                                        gruntConfigType = _priv.addTaskType(map, grunt);
                                    }

                                    // As long as the grunt config is not false, keep going
                                    if (gruntConfigType) {
                                        for (var i = 0, len = resultObject.map[map].length; i < len; i++) {
                                            var newTask = resultObject.map[map][i];

                                            gruntConfigType[newTask] = resultObject.gruntTasks[newTask];

                                            // Check to see if this need to be added to the component
                                            if (!componentDef.distTask) {
                                                componentDef.distTask = [];
                                            }

                                            componentDef.distTask.push(map + ':' + newTask);
                                        }

                                        grunt.config.set(map, gruntConfigType);
                                    }

                                    if (mapped.length !== 0) {
                                        nextMappedTask(mapped);
                                    }
                                })(Object.keys(resultObject.map).concat());

                                break;

                            case 'includePaths':
                                // We will just update the global instance for now just in case.
                                global.includePaths = resultObject.includePaths;

                                break;

                            case 'lazyPaths':
                                if (!rm.options.lazyPaths) {
                                    rm.options.lazyPaths = {};
                                }

                                (function nextLazyPath (lazyPaths) {
                                    var lPath = lazyPaths.shift();

                                    if (!rm.options.lazyPaths.hasOwnProperty(lPath)) {
                                        rm.options.lazyPaths[lPath] = resultObject.lazyPaths[lPath];
                                    }
                                    else {
                                        console.log('DUPLICATE LAZY PATH!!!!!! ', lPath,  resultObject.lazyPaths[lPath]);
                                    }

                                    if (lazyPaths.length !== 0) {
                                        nextLazyPath(lazyPaths);
                                    }
                                })(Object.keys(resultObject.lazyPaths));

                                break;

                        }

                        if (keys.length !== 0) {
                            nextKey(keys);
                        }
                    })(resultKeys);
                }
                else {
                    console.log('Error processing component: ' + componentName + ' using method: ' + componentDef.includeMethod);
                }
            });

            rm.options.components[componentName] = componentDef;

            if (components.length !== 0) {
                nextComponent(components);
            }
            else {
                // Last changes now that all the components have been looked through
                if (global.includePaths) {
                    var requireJSConfig = grunt.config.get('requirejs');
                    var includeKeys = Object.keys(global.includePaths);

                    requireJSConfig.main.options.paths = global.includePaths;

                    for (var i = 0, len = includeKeys.length; i < len; i++) {
                        var key = includeKeys[i];

                        if (requireJSConfig.main.options.include.indexOf(key) === -1) {
                            requireJSConfig.main.options.include.push(key);
                        }
                    }

                    grunt.config.set('requirejs', requireJSConfig);
                }

                next(rm);
            }
        })(Object.keys(options.components));
    };

    return {
        components: components,
    };
};

// Export the manager function as a module
module.exports = exports = new process();
