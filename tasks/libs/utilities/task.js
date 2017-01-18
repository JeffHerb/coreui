'use strict';

var _priv = {};

_priv.copy = function _copy(files, distPath, cb) {

    var taskObj = [];

    (function nextFile(files) {

        var file = files.shift();

        // Create a new object for this file.
        var copyObj = {};

        // Save of the full CWD path to the file
        copyObj.cwd = file.fullpath.substring(0, file.fullpath.lastIndexOf('/'));

        // Add the source file
        copyObj.src = [file.name];

        // default properties
        copyObj.expand = true;
        copyObj.dest = distPath;
        copyObj.filter = 'isFile';

        // Save off result
        taskObj.push(copyObj);

        if (files.length !== 0) {

            nextFile(files);
        }
        else {

            cb(taskObj);
        }

    })(files);
};

_priv.sass = function _sass (file, distPath, compName, cb) {
    var taskObj = [];

    (function nextFile (files) {

    })(files);
};

function tasks () {
    // Injects new values into an existing task from another grunt file
    var inject = function _injectTask (grunt, taskRoot, taskName, taskObj, cb) {
        var newTaskName = [];

        // Get the root config from the master grunt file
        var currentTask = grunt.config.get([taskRoot]);

        // Check to see if a root task already exists in this config so we can expand onto it.
        if (currentTask !== undefined) {
            if (typeof taskObj === 'object') {
                if (Array.isArray(taskObj)) {
                    if (!currentTask.hasOwnProperty(taskName) && newTaskName.indexOf(taskName) === -1) {
                        currentTask[taskName] = taskObj;

                        // Add this task name to the new task name list.
                        newTaskName.push(taskName);
                    }
                    else {
                        // Produce an error for now. TODO: generate guid for this task so it never happens
                        console.log(taskName + ' IS ALREADY IN GRUNTFILE!')

                        grunt.fail;
                    }
                }
                else {
                    for (var task in taskObj) {
                        if (task !== 'options') {
                            var newName = taskName + '_' + task;

                            if (!currentTask.hasOwnProperty(taskName) && newTaskName.indexOf(taskName) === -1) {
                                currentTask[newName] = taskObj[task];

                                newTaskName.push(newName);

                            }
                            else {
                                // Produce an error for now. TODO: generate guid for this task so it never happens
                                console.log(taskName + ' IS ALREADY IN GRUNTFILE!')

                                grunt.fail;
                            }
                        }
                    }
                }
            }
            else if (taskObj === 'string') {
                // Verify that the component task name is not already a reserved name
                if (!currentTask.hasOwnProperty(taskName) && newTaskName.indexOf(taskName) === -1) {
                    currentTask[taskName] = taskObj;

                    // Add this task name to the new task name list.
                    newTaskName.push(newTaskName);
                }
                else {
                    // Produce an error for now. TODO: generate guid for this task so it never happens
                    console.log(taskName + ' IS ALREADY IN GRUNTFILE!')

                    grunt.fail;
                }
            }

            // Add the task to the grunt context
            grunt.config.set(taskRoot, currentTask);
        }
        else {
            console.log('Need to create a config for: ', taskRoot);

            grunt.config.set(taskRoot, {});

            var currentTask = {};

            (function nextTask (tasks) {
                var task = tasks.shift();
                var newName = taskName + '_' + task;
                //console.log(task, taskName);

                currentTask[newName] = taskObj[task];

                newTaskName.push(newName);

                if (tasks.length !== 0) {
                    nextTask(tasks);
                }
            })(Object.keys(taskObj));

            // Add the task to the grunt context
            grunt.config.set(taskRoot, currentTask);
        }

        if (taskName === 'concat_render_helpers') {
            console.log(taskObj);
        }

        if (typeof cb === 'function') {
            cb(newTaskName);
        }
        else {
            // Return the names used
            return newTaskName;
        }
    };

    // Creates an all new task
    var newTask = function _addTask (grunt, task, type, compName, files, distPath, cb) {
        switch (task) {
            case 'copy':
                _priv.copy(files, distPath, function(taskObj) {
                    var copyConfig = grunt.config.get('copy');

                    // Add the object if its missing
                    if (copyConfig === undefined) {
                        copyConfig = _priv.createNewRoot(grunt, 'copy');
                    }

                    var newTaskName = 'copy_' + compName + '_dist_' + type;

                    if (!copyConfig.hasOwnProperty(newTaskName)) {
                        // Add the new task object to the Grunt config
                        copyConfig[newTaskName] = taskObj[0];

                        // Reapply the config.
                        grunt.config.set('copy', copyConfig);

                        cb(newTaskName)
                    }
                    else {
                        console.log('New lazy support name is already in use: ' + newTaskName);

                        cb(false);
                    }
                });

                break;

            case 'sass':
                _priv.sass(files, distPath, compName, function(){
                    var sassConfig = grunt.config.get('sass');

                    if (sassConfig === undefined) {
                        sassConfig = _priv.createNewRoot(grunt, 'sass');
                    }
                });

                break;

            case 'uglify':

                break;

        }
    };

    return {
        inject: inject,
        newTask: newTask
    };
};

// Expor the manager function as a module
module.exports = exports = new tasks();
