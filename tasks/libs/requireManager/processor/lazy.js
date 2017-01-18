'use strict';

var fs = require('../../utilities/fs');

var _priv = {};
var _taskObj = {};

var _distTasks = [];
var _distGruntTasks = {};
var _taskMap = {};

var registerPaths = {};

// Function is used to generate new grunt tasks
_priv.generateTasks = function _generatee_tasks (task, type, componentName, files, dest, cb) {
    // Create the initial name
    var taskName = componentName + '_dist-task_';

    switch (task) {
        case 'copy':

            if (!_taskMap.copy) {
                _taskMap.copy = [];
            }

            if (type === 'scripts' || type === 'styles') {

                // update name
                taskName += type;

                _taskMap.copy.push(taskName);

                // Either get the existing object or create a new one
                var tempObj = (_taskObj.hasOwnProperty(taskName)) ? _taskObj[taskName] : {};

                if (files.length === 1) {

                    tempObj.files = [];

                    tempObj.files.push({
                        'dest': fs.pathJoin(dest, files[0].name),
                        'src': [files[0].fullpath]
                    });

                    _taskObj[taskName] = tempObj;

                    if (type === 'scripts') {

                        if (files[0].fullpath.indexOf('pageScript') !== -1) {

                            registerPaths[componentName] = fs.pathJoin('js', 'scripts', files[0].name.replace('.js', ''));
                        }
                        else {

                            registerPaths[componentName] = fs.pathJoin('js', 'components', files[0].name.replace('.js', ''));
                        }

                    }
                    else {
                        registerPaths[componentName + '-' + type] = fs.pathJoin('css', 'components', files[0].name.replace('.css', ''));
                    }

                    cb(_taskObj);
                }
                else {
                    // Check to see if this is a new object or a existing
                    if (!tempObj.hasOwnProperty('files')) {

                        tempObj.files = {};
                        tempObj.files.dest = dest;
                        tempObj.files.src = [];
                        tempObj.files.flatten = true;

                        (function nextFile (files, count) {
                            var file = files.shift();

                            tempObj.files.src.push(file.fullpath);

                            // Create a registerName (lazy path)
                            if (count === 1) {
                                if (type === 'scripts') {

                                    if (file.fullpath.indexOf('pageScript') !== -1) {

                                        registerPaths[componentName] = fs.pathJoin('js', 'scripts', file.name.replace('.js', ''));

                                    } else {

                                        registerPaths[componentName] = fs.pathJoin('js', 'components', file.name.replace('.js', ''));
                                    }

                                }
                                else {
                                    registerPaths[componentName + '-' + type] = fs.pathJoin('css', 'components', file.name.replace('.css', ''));
                                }
                            }
                            else {
                                if (type === 'scripts') {
                                    if (file.name.replace('.', '') === componentName) {

                                        if (file.fullpath.indexOf('pageScript') !== -1) {


                                            registerPaths[componentName] = fs.pathJoin('js', 'scripts', file.name.replace('.js', ''));

                                        } else {

                                            registerPaths[componentName] = fs.pathJoin('js', 'components', file.name.replace('.js', ''));
                                        }

                                    }
                                    else {

                                        if (file.fullpath.indexOf('pageScript') !== -1) {

                                            registerPaths[componentName + '-' + file.name.replace('.', '')] = fs.pathJoin('js', 'components', file.name.replace('.js', ''));

                                        } else {

                                            registerPaths[componentName + '-' + file.name.replace('.', '')] = fs.pathJoin('js', 'components', file.name.replace('.js', ''));
                                        }

                                    }
                                }
                                else {
                                    registerPaths[componentName + '-' + type + '-' + file.name.replace('.', '')] = fs.pathJoin('css', 'components', file.name.replace('.css', ''));
                                }
                            }

                            if (files.length !== 0) {
                                nextFile(files, count);
                            }
                            else {
                                _taskObj[taskName] = tempObj;

                                cb(_taskObj);
                            }
                        })(files.concat(), files.length);
                    }
                    else {
                        (function nextFile (files) {
                            var file = files.shift();

                            tempObj.files.src.push(file.fullpath);

                            if (files.length !== 0) {
                                nextFile(files);
                            }
                            else {
                                _taskObj[taskName] = tempObj;

                               cb(_taskObj);
                            }
                        })(files.concat());
                    }
                }
            }

            break;

        case 'uglify':
            if (!_taskMap.uglify) {
                _taskMap.uglify = [];
            }

            // update name
            taskName += 'script';

            _taskMap.uglify.push(taskName);

            var tempObj = (_taskObj.hasOwnProperty(taskName)) ? _taskObj[taskName] : {};

            // Check to see if the temp item exists, if not create it.
            if (!tempObj.hasOwnProperty('files')) {
                tempObj.files = {};
            }

            (function nextFile (files) {
                var file = files.shift();

                if (file.name.charAt(0) !== 0) {
                    // Create the dest path and name
                    var finishedFile = fs.pathJoin(dest, file.name);

                    // Add the registered path
                    registerPaths[componentName] = fs.pathJoin('js', 'components', file.name.replace('.js', ''));

                    // Create the new property
                    tempObj.files[finishedFile] = [file.fullpath];
                }

                if (files.length !== 0) {
                    nextFile(files);
                }
                else {
                    _taskObj[taskName] = tempObj;

                    cb(_taskObj);
                }
            })(files.concat());

            break;

        case 'cssmin':
            if (!_taskMap.cssmin) {
                _taskMap.cssmin = [];
            }

            // update name
            taskName += 'style';

            _taskMap.cssmin.push(taskName);

            var tempObj = (_taskObj.hasOwnProperty(taskName)) ? _taskObj[taskName] : {};

            // Check to see if the temp item exists, if not create it.
            if (!tempObj.hasOwnProperty('files')) {
                tempObj.files = {};
            }

            (function nextFile (files) {
                var file = files.shift();

                if (file.name.charAt(0) !== 0) {
                    // Create the dest path and name
                    var finishedFile = fs.pathJoin(dest, file.name);

                    registerPaths[componentName + '-' + type] = fs.pathJoin('css', 'components', file.name.replace('.css', ''));

                    // Create the new property
                    tempObj.files[finishedFile] = [file.fullpath];
                }

                if (files.length !== 0) {
                    nextFile(files);
                }
                else {
                    _taskObj[taskName] = tempObj;

                    cb(_taskObj);
                }
            })(files.concat());

            break;

        case 'sass':
            if (!_taskMap.sass) {
                _taskMap.sass = [];
            }

            // update name
            taskName += type;

            var tempObj = (_taskObj.hasOwnProperty(taskName)) ? _taskObj[taskName] : {};

            _taskMap.sass.push(taskName);

            if (!tempObj.hasOwnProperty('files')) {
                tempObj.files = {};
            }

            (function nextFile (files) {
                var file = files.shift();

                if (file.name.charAt(0) !== 0) {
                    // Create the dest path and name
                    var finishedFile = fs.pathJoin(dest, file.name.replace('.' + file.ext, '.css'));

                    // Create the new property
                    tempObj[finishedFile] = [file.fullpath];
                }

                if (files.length !== 0) {
                    nextFile(files);
                }
                else {
                    _taskObj[taskName] = tempObj;

                    cb(_taskObj);
                }
            })(files.concat());

            break;

        default:
            console.log('No task type definition found');
            cb(false);

            break;
    }
};

_priv.processTasks = function _process_tasks (newTasks) {
    var newTasksNames = Object.keys(newTasks);

    if (newTasks !== 0) {
        (function nextTask (tasks) {
            var taskName = tasks.shift();

            if (taskName !== undefined) {
                // Add the task to the distTask list of names
                if (_distTasks.indexOf(taskName) === -1) {
                    _distTasks.push(taskName);
                }

                // Add or update the gruntTask object
                _distGruntTasks[taskName] = newTasks[taskName];
            }

            if (tasks.length !== 0) {
                nextTask(tasks);
            }
        })(newTasksNames.concat());
    }
};

var lazy = function _lazy () {
    var component = function _component (component, grunt, global, cb) {
        var files = component.distFiles;

        if (_distTasks.length) {
            _distTasks = [];
            _distGruntTasks = {};
            _taskObj = {};
            _taskMap = [];
            registerPaths = {};
        }

        // Check to see if we already have a broke down assets, if so make a copy of the assets for future reference
        if (component.sortedAssets) {
            component.lastAssetSort = component.sortedAssets;
        }

        // Create or reset the sorted object
        component.sortedAssets = {};

        // Check to make sure we have files to sort through
        if (files.length !== 0) {
            (function nextFile (files) {
                var file = files.shift();

                switch (file.ext) {
                    // Scripts
                    case 'js':
                        // Check to see if we have a place for the saved scripts
                        if (!component.sortedAssets.hasOwnProperty('scripts')) {
                            component.sortedAssets.scripts = {
                                files: [],
                            };
                        }

                        component.sortedAssets.scripts.files.push(file);

                        break;

                    case 'css':
                        // Check to see if we have a place for the saved scripts
                        if (!component.sortedAssets.hasOwnProperty('styles')) {
                            component.sortedAssets.styles = {
                                files: [],
                            };
                        }

                        component.sortedAssets.styles.files.push(file);

                        break;

                    case 'scss':
                    case 'sass':
                        // Check to see if we have a place for the saved scripts
                        if (!component.sortedAssets.hasOwnProperty('sass')) {
                            component.sortedAssets.sass = {
                                files: [],
                            };
                        }

                        component.sortedAssets.sass.files.push(file);

                        break;
                }

                if (files.length !== 0) {
                    nextFile(files)
                }
                else {
                    var assetTypes = Object.keys(component.sortedAssets);

                    if (assetTypes.length !== 0) {

                        var buildMode = grunt.config.get('prod');

                        (function nextAssetType (assets) {
                            var asset = assets.shift();

                            switch (asset) {

                                // Scripts and styles are easy, just need to make a copy task.
                                case 'scripts':

                                    if (component.settings.pageScripts) {

                                        var dest = fs.pathJoin('dist', 'js', 'scripts');
                                    }
                                    else {

                                        var dest = fs.pathJoin('dist', 'js', 'components');
                                    }


                                    if (buildMode) {
                                        _priv.generateTasks('uglify', asset, component.name, component.sortedAssets[asset].files, dest, _priv.processTasks);
                                    }
                                    else {
                                        _priv.generateTasks('copy', asset, component.name, component.sortedAssets[asset].files, dest, _priv.processTasks);
                                    }

                                    break;

                                case 'styles':
                                    var dest = fs.pathJoin('dist', 'css', 'components');

                                    if (buildMode) {
                                        _priv.generateTasks('cssmin', asset, component.name, component.sortedAssets[asset].files, dest, _priv.processTasks);
                                    }
                                    else {
                                        _priv.generateTasks('copy', asset, component.name, component.sortedAssets[asset].files, dest, _priv.processTasks);
                                    }

                                    break;

                                case 'sass':
                                    var dest = fs.pathJoin('dist', 'css', 'components');

                                    _priv.generateTasks('sass', asset, component.name, component.sortedAssets[asset].files, dest, _priv.processTasks);

                                    break;

                            }

                            if (assets.length !== 0) {
                                nextAssetType(assets);
                            }
                            else {
                                cb({
                                    distTasks: _distTasks,
                                    gruntTasks: _distGruntTasks,
                                    map: _taskMap,
                                    lazyPaths: registerPaths
                                });
                            }
                        })(assetTypes);
                    }
                }
            })(files.concat());
        }
        else {
            console.log('No component dist files found for: ', component.name);
            cb(false);
        }
    };

    return {
        component: component,
    };
};

// Export the manager function as a module
module.exports = exports = new lazy();
