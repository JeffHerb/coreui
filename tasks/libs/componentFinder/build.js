'use strict';

// Custom node modules
var fs = require('../utilities/fs');
var gTasks = require('../utilities/task');

String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

var runTests =[];

var _priv = {};

// Function will analyze the
_priv.updateTaskPaths = function _update_paths (taskObj, componentPath, componentName, taskName) {
    if (typeof taskObj === 'string') {
        taskObj = fs.pathJoin(componentPath, taskObj);
    }
    else if (Array.isArray(taskObj)) {

        var newArray = [];

        for (var i = 0, len = taskObj.length; i < len; i++) {
            if (typeof taskObj[i] === 'string') {
                newArray.push(fs.pathJoin(componentPath, taskObj[i]));
            }
            else if (typeof taskObj[i] === 'object') {
                if (taskObj[i].dest && taskObj[i].src) {
                    taskObj[i].dest = fs.pathJoin(componentPath, taskObj[i].dest);

                    if (taskObj[i].cwd) {
                        taskObj[i].cwd = fs.pathJoin(componentPath, taskObj[i].cwd);
                    }
                    else {
                        if (typeof taskObj[i].src === 'string') {
                            taskObj[i].src = fs.pathJoin(componentPath, taskObj[i].src);
                        }
                        else if (Array.isArray(taskObj[i].src)) {
                            var newSourceArray = [];

                            for (var k = 0, kLen = taskObj[i].src.length; k < kLen; k++) {
                                newSourceArray.push(fs.pathJoin(componentPath, taskObj[i].src[k]));
                            }

                            taskObj[i].src = newSourceArray;
                        }
                    }

                    newArray.push(taskObj[i]);
                }
                else {
                    console.log('Unknown array of objects');
                    return false;
                }
            }
        }

        taskObj = newArray;
    }
    else if (typeof taskObj === 'object') {
        if (taskObj.dest && taskObj.src) {
            // Cheat!, just wrap this in an array and pass it to the function again!
            taskObj = _priv.updateTaskPaths([taskObj], componentPath, componentName, taskName)[0];
        }
        else if (taskObj.files) {
            if (Array.isArray(taskObj.files)) {
                //console.log(taskObj.files);
                taskObj.files = _priv.updateTaskPaths(taskObj.files, componentPath, componentName, taskName);
            }
            else {
                // We have a files object.
                var newObj = {};

                // Loop through each dest/source path
                for (var key in taskObj.files) {
                    var newKey = fs.pathJoin(componentPath, key);

                    if (typeof taskObj.files[key] === 'string') {
                        newObj[newKey] = fs.pathJoin(componentPath, taskObj.files[key])
                    }
                    else if (Array.isArray(taskObj.files[key])) {
                        var newSourceArray = [];

                        for (var i = 0, len = taskObj.files[key].length; i < len; i++) {
                            if (typeof taskObj.files[key][i] === 'string') {
                                newSourceArray.push(fs.pathJoin(componentPath, taskObj.files[key][i]));
                            }
                            else if (typeof taskObj.files[key][i] === 'object') {
                                newSourceArray.push(_priv.updateTaskPaths([taskObj.files[key][i]], componentPath, componentName, taskName)[0]);
                            }
                        }

                        newObj[newKey] = newSourceArray;
                    }
                    else {
                        console.log('Unknown taskObj.files type');

                        return false;
                    }
                }

                taskObj.files = newObj;
            }
        }
        else if (taskObj.options && Object.keys(taskObj).length === 1) {
            // check for key object properties
            if (taskObj.options.baseUrl) {
                taskObj.options.baseUrl = fs.pathJoin(componentPath, taskObj.options.baseUrl);;
            }

            if (taskObj.options.out) {
                taskObj.options.out = fs.pathJoin(componentPath, taskObj.options.out);;
            }

            if (taskName === 'intern' && (runTests.length == 0 || runTests.indexOf(componentName.toString()) >= 0)) {
                if (taskObj.options.suites) {
                    var newSuiteArray = [];

                    for (var i = 0, len = taskObj.options.suites.length; i < len; i++) {
                        // find the keyword test
                        var testFolderPos = taskObj.options.suites[i].indexOf('/');

                        newSuiteArray.push(taskObj.options.suites[i].splice(testFolderPos, 0, '/' + componentName));
                    }

                    taskObj.options.suites = newSuiteArray;
                }

                if (taskObj.options.functionalSuites) {
                    var newFuncSuiteArray = [];

                    for (var i = 0, len = taskObj.options.functionalSuites.length; i < len; i++) {
                        // find the keyword test
                        var testFolderPos = taskObj.options.functionalSuites[i].indexOf('/');

                        //newFuncSuiteArray.push(taskObj.options.functionalSuites[i].splice(testFolderPos, 0, '/' + componentName));
                        newFuncSuiteArray.push(taskObj.options.functionalSuites[i]);
                    }

                    taskObj.options.functionalSuites = newFuncSuiteArray;
                }
            }
        }
        else {

            console.log('Uknown taskObj: ', taskObj);
        }

    }

    return taskObj;

};

var build = function _build () {
    var tasks = function _tasks (rm, next) {
        var options = rm.options;
        var grunt = rm.grunt;
        var skipTask = rm.options.excludes.buildTasks;
        var newTasks = [];

        var cmdRunTests = grunt.option('runTests');

        if(cmdRunTests && typeof cmdRunTests != 'boolean' && cmdRunTests != '\'\'' && cmdRunTests != '\"\"'){
            runTests = grunt.option('runTests');
        }

        // Start by looping throught the components
        (function nextComponent (components) {
            var componentName = components.shift();
            var componentDef = rm.options.components[componentName];

            // Check to see if the component has a build process
            if (componentDef.build) {
                // Load the temp module create from the original task grunt file
                componentDef.build = require('./temp/' + componentName)();

                if (!componentDef.buildTask) {
                    componentDef.buildTasks = [];
                    componentDef.watchTasks = [];
                    componentDef.testTasks = [];
                }

                var tasks = Object.keys(componentDef.build);

                if (tasks.length !== 0) {
                    (function nextTask (tasks) {
                        // Pull the task name
                        var taskName = tasks.shift();
                        var taskObj = componentDef.build[taskName];
                        var hasOptions = false;
                        var taskOptions = false;

                        // Get a copy of the current grunt config
                        var gruntTaskConfig = grunt.config.get(taskName);

                        if (gruntTaskConfig === undefined || gruntTaskConfig === null) {
                            grunt.config.set(taskName, {});
                            gruntTaskConfig = {};
                        }

                        if (skipTask.indexOf(taskName) === -1) {
                            var subTasks = Object.keys(taskObj);

                            // Check to see if we have an options object
                            if (subTasks.indexOf('options') !== -1) {
                                hasOptions = true;
                                taskOptions = taskObj.options;

                                // Loop through and fix any options based paths keys we know of
                                for (var key in taskOptions) {
                                    switch (key) {
                                        case 'template':
                                            taskOptions[key] = fs.pathJoin(componentDef.fullpath, taskOptions[key]);
                                            break;
                                    }
                                }

                                subTasks.splice(subTasks.indexOf('options'), 1);
                            }

                            // Process the tasks in order
                            (function nextSubTask(subTasks) {
                                var subTask = subTasks.shift();
                                var subTaskObj = taskObj[subTask];
                                var newTaskName = componentName + '_build-task_' + taskName + '_' + subTask;
                                var updatedSubTaskObj = _priv.updateTaskPaths(subTaskObj, componentDef.fullpath, componentName, taskName);

                                // check clean task for assitional requirements.
                                if (taskName === 'clean') {
                                    if (typeof updatedSubTaskObj === 'string') {
                                        // Check to see if the all select path is missing first
                                        if (updatedSubTaskObj.indexOf('**/*.*') === -1) {
                                            if (updatedSubTaskObj.slice(-1) === '/') {
                                                updatedSubTaskObj + '/**/*.*';
                                            }
                                            else {
                                                updatedSubTaskObj + '**/*.*';
                                            }
                                        }
                                    }
                                    else if (Array.isArray(updatedSubTaskObj)) {
                                        var tempArray = [];

                                        for (var i = 0, len = updatedSubTaskObj.length; i < len; i++) {
                                            var cleanPath = updatedSubTaskObj[i];

                                            if (cleanPath.indexOf('**/*.*') === -1) {
                                                if (cleanPath.slice(-1) === '/') {
                                                    tempArray.push(cleanPath + '**/*.*');
                                                }
                                                else {
                                                    tempArray.push(cleanPath + '/**/*.*');
                                                }
                                            }
                                            else {
                                                tempArray.push(cleanPath);
                                            }
                                        }

                                        updatedSubTaskObj = tempArray;
                                    }
                                }

                                if (updatedSubTaskObj) {
                                    // Check to see if we have to deal with the options
                                    if (hasOptions) {
                                        if (taskName !== 'watch') {
                                            updatedSubTaskObj.options = taskOptions;
                                        }

                                        gruntTaskConfig[newTaskName] = updatedSubTaskObj;
                                    }
                                    else {
                                        // Add the new object to the grunt config
                                        gruntTaskConfig[newTaskName] = updatedSubTaskObj;
                                    }

                                    if (taskName !== 'watch') {
                                        componentDef.buildTasks.push(taskName + ':' + newTaskName);

                                        newTasks.push(taskName + ':' + newTaskName);
                                    }
                                    else {
                                        componentDef.watchTasks.push(taskName + ':' + newTaskName);
                                    }
                                }

                                if (subTasks.length !== 0) {
                                    nextSubTask(subTasks);
                                }
                                else {
                                    grunt.config.set(taskName, gruntTaskConfig);
                                }

                            })(subTasks);
                        }
                        else {
                            // Check to see if we have any test tasks.

                            if (taskName === 'intern' && (runTests.length == 0 || runTests.indexOf(componentName.toString()) >= 0)) {
                                var subTasks = Object.keys(taskObj);
                                var newTestTasks = {};

                                // Process the tasks in order
                                (function nextSubTask (subTasks) {

                                    var subTask = subTasks.shift();
                                    var subTaskObj = taskObj[subTask];
                                    var newTaskName = componentName + '_test-task_' + subTask;

                                    // Fix the subtask options
                                    var internOptions = _priv.updateTaskPaths(subTaskObj, componentDef.fullpath, componentName, taskName);

                                    //If using the internReport flag, update intern reporter to write the log file.
                                    if(grunt.option('testReport')){
                                        if(internOptions.options.reporters){
                                            internOptions.options.reporters = [
                                                {id:"Runner"},
                                                {id:"JUnit", filename:'tests/'+componentName+'/report.xml'},
                                            ];
                                        }
                                    }

                                    componentDef.testTasks.push(taskName + ':' + newTaskName);

                                    //grunt.config.set(taskName, gruntTaskConfig);
                                    newTestTasks[newTaskName] = internOptions

                                    if (subTasks.length > 0) {
                                        nextSubTask(subTasks);
                                    }
                                    else {
                                        //gruntTaskConfig[newTaskName] = taskObj;

                                        // Loop through and add the test tasks to the grunt config
                                        for (var task in newTestTasks) {
                                            if (!gruntTaskConfig[task]) {
                                                gruntTaskConfig[task] = newTestTasks[task];
                                            }
                                            else {
                                                console.log('Test task name already exists:', task);
                                            }
                                        }

                                        // Apply the new test tasks
                                        grunt.config.set(taskName, gruntTaskConfig);
                                    }
                                })(subTasks);
                            }
                        }

                        if (tasks.length !== 0) {
                            nextTask(tasks);
                        }
                        else {
                            // Now that all of the have been built for for this component see if we need to refreash any of the watch task
                            if (componentDef.watchTasks.length !== 0) {
                                var watchTasks = grunt.config.get('watch');

                                (function nextWatch (watches) {
                                    var watchTaskName = watches.shift();
                                    var shortName = watchTaskName.split(':')[1];
                                    var watchExecuteTasks = watchTasks[shortName].tasks;
                                    var discoveredBuildTasks = [];

                                    if (watchExecuteTasks.length !== 0) {
                                        // Loop the different execute tasks and find the correct build tasks that apply
                                        (function nextExecuteTask (eTasks) {
                                            var eTask = eTasks.shift();

                                            // Now we need to loop through the
                                            for (var i = 0, len = componentDef.buildTasks.length; i < len; i++) {
                                                if (componentDef.buildTasks[i].indexOf(eTask + ':') !== -1) {
                                                    discoveredBuildTasks.push(componentDef.buildTasks[i]);
                                                }
                                            }

                                            if (eTasks.length !== 0) {
                                                nextExecuteTask(eTasks);
                                            }
                                        })(watchExecuteTasks.concat());
                                    }

                                    // Update the tasks array with the new one
                                    watchTasks[shortName].tasks = discoveredBuildTasks;

                                    grunt.config.set('watch', watchTasks);

                                    if (watches.length !== 0) {
                                        nextWatch(watches);
                                    }
                                })(componentDef.watchTasks.concat());
                            }
                        }
                    })(tasks);
                }

                // Update the component definition
                rm.options.components[componentName] = componentDef;
            }

            if (components.length !== 0) {
                nextComponent(components);
            }
            else {
                if (newTasks.length !== 0) {
                    grunt.task.clearQueue();

                    for (var i = 0, len = newTasks.length; i < len; i++) {
                        grunt.task.run(newTasks[i]);
                    }
                }

                next(rm);
            }
        })(Object.keys(rm.options.components));
    }

    return {
        tasks: tasks,
    };
};

module.exports = exports = new build();
