'use strict';

var fs = require('../utilities/fs');
var handlebars = require('handlebars');

var _priv = {};

_priv.staticFolders = function _static_folders (path, excludeFolders, cb) {
    var searchOptions = {
        shallow: true,
        filter: {
            files:true
        },
        skip: {
            folders: excludeFolders
        }
    };

    fs.recursive(path, searchOptions, function (folderList) {
        if (folderList.length !== 0) {
            cb(folderList);
        }
        else {
            cb(false);
        }
    });
};

_priv.newTask = function _new_task (dest, source, type, glob, cb) {
    var newTask = {};

    switch (type) {

        case 'copy':
            newTask.files = {
                expand: true,
                dest: dest,
                filter: 'isFile',
            };

            if (glob !== undefined && glob !== null) {
                newTask.files.cwd = source;
                newTask.files.src = glob;
            }
            else {
                newTask.files.src = source;
            }

            cb({files:[newTask.files]});

            break;

        case 'watch':
            newTask.files = glob;
            newTask.tasks = dest;

            cb(newTask);

            break;

        default:
            console.log('Unknown task type requested');

            cb(false);

            break;
    }
};

_priv.sortTasks = function _sort_tasks (taskArray) {

    function compareTasks (a, b) {
        function getTaskValue (task) {
            var returnVal = null;

            task = task.split(':')[0];

            switch (task) {
                case 'jshint':
                    returnVal = -1;
                    break;

                case 'clean':
                    returnVal = 0;
                    break;

                case 'sass':
                case 'concat':
                case 'markdown':
                case 'requirejs':
                case 'handlebars':
                case 'bake':
                    returnVal = 5;
                    break;

                case 'copy':
                    returnVal = 10;
                    break;
            }

            return returnVal;
        }

        var aTask = getTaskValue(a);
        var bTask = getTaskValue(b);

        if (aTask < bTask) {
            return -1;
        }
        else if (aTask > bTask) {
            return 1;
        }
        else {
            return 0;
        }
    }

    return taskArray.sort(compareTasks);
};

var build = function _build () {

    var requireFile = function _require_file (rm, next) {
        var options = rm.options;
        var grunt = rm.grunt;

        // Get the settings template file
        var settingsFile = grunt.file.read('tasks/libs/requireManager/templates/require-settings.hbs');

        // Get the project JS file
        var projectJS = grunt.file.read('src/project/js/project.js');

        var template = handlebars.compile(settingsFile);

        var data = {
            paths: options.lazyPaths,
            projectJS: projectJS
        };

        if (options.registerFiles && Object.keys(options.registerFiles).length >= 1) {

            for (var file in options.registerFiles) {

                if (!data.paths.hasOwnProperty(file)) {
                    data.paths[file] = 'js/scripts/' + options.registerFiles[file]
                }

            }

        }

        // Process the template file
        var result = template(data);

        var ws = new fs.writeStream('settings');

        ws.on('finish', function () {
            var contents = this.data();

            try {
                // Build destination
                var dist = fs.pathJoin('tasks/libs/requireManager/temp', 'settings.js');

                fs.writeFile(dist, contents);

            }
            catch(e) {
                console.log(e);
            }
        });

        ws.write(result);

        // Close the stream and
        ws.end();

        next(rm);
    };

    var folderTasks = function _folder_tasks (rm, next) {

        console.log("Got to folderTasks - build");

        var options = rm.options;
        var grunt = rm.grunt;

        // Loop all of the components looking for special folders
        (function nextComponent (components) {
            var componentName = components.shift();
            var componentDef = rm.options.components[componentName];
            var distFolder = (componentDef.build) ? fs.pathJoin(componentDef.fullpath, 'dist') : componentDef.fullpath;
            var newDistTask = [];
            var excludeFolders = ['src'].concat(options.excludes.folders);

            _priv.staticFolders(distFolder, excludeFolders, function (folderList) {

                if (folderList) {
                    // Loop through and test for specific folders
                    (function nextFolder (folders) {
                        var folder = folders.shift();

                        if (excludeFolders.indexOf(folder.name) === -1) {
                            var srcFolder = folder.fullpath;
                            var destFolder = null;
                            var glob = null;
                            var task = null;

                            switch (folder.name) {
                                case 'test':
                                case 'tests':
                                    destFolder = fs.pathJoin('tests', componentName);

                                    // Tests only support html files
                                    glob = ['**/*.*'];
                                    task = 'copy';

                                    break;

                                // Fix to put the old test files back into the dist folder
                                case 'test-old':
                                case 'tests-old':
                                    destFolder = fs.pathJoin('dist', 'tests', componentName);

                                    // Tests only support html files
                                    glob = ['**/*.*'];
                                    task = 'copy';

                                    break;

                                case 'image':
                                case 'images':
                                    destFolder = fs.pathJoin('dist', 'images');
                                    glob = ['**/*.*'];
                                    task = 'copy';

                                    break;

                                case 'font':
                                case 'fonts':

                                    destFolder = fs.pathJoin('dist', 'fonts');
                                    glob = ['**/*.*'];
                                    task = 'copy';

                                    break;
                            }

                            if (task !== null) {
                                _priv.newTask(destFolder, srcFolder, task, glob, function (taskObj) {
                                    if (taskObj) {
                                        var newTaskName = componentName + '_dist-task_' + folder.name;

                                        var gruntConfig = grunt.config.get(task);

                                        gruntConfig[newTaskName] = taskObj;

                                        grunt.config.set(task, gruntConfig);

                                        newDistTask.push(task + ':' + newTaskName);
                                    }
                                });
                            }
                        }

                        if (folders.length !== 0) {
                            nextFolder(folders);
                        }
                        else {
                            if (newDistTask.length !== 0) {
                                if (!componentDef.distTask) {
                                    componentDef.distTask = [];
                                }

                                componentDef.specialFolderTasks = [];

                                componentDef.specialFolderTasks = componentDef.distTask.concat(newDistTask);

                                //componentDef.distTask = componentDef.specialFolderTasks;

                                // Update the root component
                                rm.options.components[componentName] = componentDef;
                            }
                        }
                    })(folderList.concat());
                }
            });

            // Check to see if we have any more components
            if (components.length !== 0) {
                nextComponent(components);
            }
            else {
                next(rm);
            }
        })(Object.keys(options.components));
    };

    var watch = function _watch (rm, next) {
        var options = rm.options;
        var grunt = rm.grunt;
        var prodBuild = grunt.config.get('prod');
        var wOptions;

        // Check to make sure this is not a prod build
        if (!prodBuild) {
            (function nextComponent (components) {
                var componentName = components.shift();
                var componentDef = rm.options.components[componentName];
                var glob;
                var tasks;

                if (!componentDef.watchTasks) {
                    componentDef.watchTasks = [];
                }

                // Get the current watch configs
                var gruntWatchConfig = grunt.config.get('watch');

                wOptions = gruntWatchConfig.options;

                // Start by handeling the root includ tasks.
                if (componentDef.includeMethod === 'include') {
                    // Get the current watch config
                    var genericIncludeTasks = ['sass:main', 'requirejs:main'];

                    // If this task has no dist or build tasks, then its just a component folder level watch
                    if (componentDef.distTask === undefined && componentDef.buildTasks === undefined) {
                        glob = [fs.pathJoin(componentDef.fullpath, '**/*.*')];
                        tasks = genericIncludeTasks.concat();

                        _priv.newTask(tasks, undefined, 'watch', glob, function (taskObj) {
                            if (taskObj) {
                                //taskObj['options'] = wOptions;
                                var newTaskName = componentName + '_component-watch';

                                gruntWatchConfig[newTaskName] = taskObj;

                                grunt.config.set('watch', gruntWatchConfig);

                                componentDef.watchTasks.push('watch:' + newTaskName);
                            }
                        });
                    }
                    // Check to see if the component does have a buld task, if it does then we need to watch for dist changes
                    else if (componentDef.buildTasks || componentDef.distTask) {
                        glob = '';
                        tasks = [];

                        // Start by double checking for a dist task.
                        if (componentDef.distTask && componentDef.distTask.length !== 0 && componentDef.buildTasks && componentDef.buildTasks === 0) {
                            // Set the glob path
                            glob = [fs.pathJoin(componentDef.fullpath, 'dist', '**/*.*')];

                            // Since we have dist tasks, lets merge those into the task array first
                            tasks = tasks.concat(_priv.sortTasks(componentDef.distTask));

                            // Also lets check for special folder tasks.
                            if (componentDef.specialFolderTasks && componentDef.specialFolderTasks.length !== 0) {
                                tasks = tasks.concat(_priv.sortTasks(componentDef.specialFolderTasks));
                            }

                            // Just tack on the standard include tasks.
                            tasks = tasks.concat(genericIncludeTasks.concat());

                            // Create the watch task for the include part
                            _priv.newTask(tasks, undefined, 'watch', glob, function (taskObj) {
                                if (taskObj) {
                                    //taskObj['options'] = wOptions;
                                    var newTaskName = componentName + '_component-watch-dist';

                                    gruntWatchConfig[newTaskName] = taskObj;

                                    grunt.config.set('watch', gruntWatchConfig);

                                    componentDef.watchTasks.push('watch:' + newTaskName);
                                }
                            });
                        }

                        // Now look at the build task
                        if (componentDef.buildTasks && componentDef.buildTasks.length !== 0) {
                            if (componentDef.buildTasks.length > 0) {
                                console.log('COMPONENT ALREADY HAS DEFINED WATCH TASKS! ' + componentName);
                            }

                            // Change/set glob to source path
                            glob = [fs.pathJoin(componentDef.fullpath, 'src', '**/*.*')];

                            tasks = tasks.concat(_priv.sortTasks(componentDef.buildTasks.concat()));

                            // After the build, add on and dist tasks that would need to be executed if they exist
                            if (componentDef.distTask && componentDef.distTask.length) {
                                tasks = tasks.concat(_priv.sortTasks(componentDef.distTask));
                            }

                            // Also lets check for special folder tasks.
                            if (componentDef.specialFolderTasks && componentDef.specialFolderTasks.length !== 0) {
                                tasks = tasks.concat(_priv.sortTasks(componentDef.specialFolderTasks));
                            }

                            // Now add default include tasks
                            tasks = tasks.concat(genericIncludeTasks.concat());

                            _priv.newTask(tasks, undefined, 'watch', glob, function (taskObj) {
                                if (taskObj) {
                                    //taskObj['options'] = wOptions;
                                    var newTaskName = componentName + '_component-watch-build';

                                    gruntWatchConfig[newTaskName] = taskObj;

                                    grunt.config.set('watch', gruntWatchConfig);

                                    componentDef.watchTasks.push('watch:' + newTaskName);
                                }
                            });
                        }
                    }
                    else {
                        console.log('LOOK AT THIS COMPONENT: ' + componentName);
                    }
                }
                // The component is setup for lazy options
                else {
                    // Check to see if the component has a build task
                    if (componentDef.buildTasks && componentDef.buildTasks.length !== 0) {

                        // See if the component doesnt have it own its own watch task, and lets make one!
                        if (!componentDef.build.watch) {
                            // Set glob to source path
                            glob = [fs.pathJoin(componentDef.fullpath, 'src', '**/*.*')];
                            tasks = [];

                            // Start by getting the build tasks.
                            tasks = tasks.concat(_priv.sortTasks(componentDef.buildTasks.concat()));

                            // After the build, add on and dist tasks that would need to be executed if they exist
                            if (componentDef.distTask && componentDef.distTask.length) {
                                tasks = tasks.concat(_priv.sortTasks(componentDef.distTask));
                            }

                            // Also lets check for special folder tasks.
                            if (componentDef.specialFolderTasks && componentDef.specialFolderTasks.length !== 0) {
                                tasks = tasks.concat(_priv.sortTasks(componentDef.specialFolderTasks));
                            }

                            _priv.newTask(tasks, undefined, 'watch', glob, function (taskObj) {
                                if (taskObj) {
                                    //taskObj['options'] = wOptions;
                                    var newTaskName = componentName + '_component-watch-build';

                                    gruntWatchConfig[newTaskName] = taskObj;

                                    grunt.config.set('watch', gruntWatchConfig);

                                    componentDef.watchTasks.push('watch:' + newTaskName);
                                }
                            });
                        }
                        // Task has a watch task.
                        else {
                            // Check to make sure it has at least a dist task.
                            if (componentDef.distTask && componentDef.distTask.length !== 0 && componentDef.watchTasks.length !== 0) {

                                // Lets look throught all the watch tasks
                                (function nextWatchTask (watchTasks) {
                                    var taskName = watchTasks.shift().split(':')[1];

                                    gruntWatchConfig[taskName].tasks = gruntWatchConfig[taskName].tasks.concat(componentDef.distTask);

                                    //gruntWatchConfig[taskName]['options'] = wOptions;

                                    grunt.config.set('watch', gruntWatchConfig);

                                    if (watchTasks.length !== 0) {
                                        nextWatchTask(watchTasks);
                                    }
                                })(componentDef.watchTasks.concat());
                            }
                        }
                    }
                    else {
                        if (componentDef.distTask && componentDef.distTask.length !== 0) {
                            // Get the source path (the component itself)
                            glob = [fs.pathJoin(componentDef.fullpath, 'src', '**/*.*')];
                            tasks = componentDef.distTask.concat();

                            _priv.newTask(tasks, undefined, 'watch', glob, function (taskObj) {
                                if (taskObj) {
                                    //taskObj['options'] = wOptions;
                                    var newTaskName = componentName + '_component-watch';

                                    gruntWatchConfig[newTaskName] = taskObj;

                                    grunt.config.set('watch', gruntWatchConfig);

                                    componentDef.watchTasks.push('watch:' + newTaskName);
                                }
                            });
                        }
                    }
                }

                rm.options.components[componentName] = componentDef;

                // Check to see if we have any more components
                if (components.length !== 0) {
                    nextComponent(components);
                }
                else {
                    next(rm);
                }

            })(Object.keys(options.components));
        }
        else {
            next(rm);
        }
    };

    var mode = function _mode (rm, next) {
        var grunt = rm.grunt;
        var test = grunt.config.get('test');

        // Check to see if the requested mode is set to test build.
        if (test) {
            _priv.newTask('tests', 'tasks/libs/testManager/config/intern.js', 'copy', undefined, function (task) {
                var copyTasks = grunt.config.get('copy');

                task.files[0].flatten = true;

                copyTasks['intern-test-config-inject'] = task;

                grunt.config.set('copy', copyTasks);

                next(rm);
            });
        }
        else {
            next(rm);
        }
    };

    return {
        folderTasks: folderTasks,
        mode: mode,
        requireFile: requireFile,
        watch: watch,
    };
};

// Export the manager function as a module
module.exports = exports = new build();
