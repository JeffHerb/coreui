module.exports = function (grunt) {
    'use strict';

    /*
     * Component Finder:
     * Component finder is a Core UI module grunt task used to search a specific src/project, src/cui folder structure to discover modular components used by the Core UI framework.
     */

    // Constants
    var TASK_DESCRIPTION = 'Require Manager for Core UI';

    // Step Manager
    var manager = require('./libs/stepManager/manager');

    // Component Loader Librarys
    var base = require('./libs/requireManager/base');
    var build = require('./libs/requireManager/build');
    var search = require('./libs/requireManager/search');
    var tasks = require('./libs/requireManager/tasks');
    var process = require('./libs/requireManager/process');

    // Define the Grunt Multitask for the Require Manager Task;
    grunt.registerTask('requireManager', TASK_DESCRIPTION, function () {

        var options = {
            configOrder: {
                first: ['clean'],

                // This order matters as task will be executed in this order!
                last: [
                        'sass_globbing',
                        'sass',
                        'requirejs',
                        'concat',
                        'usebanner',
                        'connect',
                        'watch',
                        'intern',
                    ],
            },
            prodIgnoreTasks: [
                                'connect',
                                'watch',
                                'intern',
                            ],
            runAll: [
                        'watch',
                        'connect',
                    ],
            includeTasks: [
                'clean:dist',
                'sass:main',
                'requirejs:main',
                'concat',
                'usebanner',
            ],
            excludes: {
                folders: [
                    '.git',
                    'node_modules',
                    'tasks',
                ],
            },
        };

        // Call the manager and execute the following steps.
        manager.init(this, grunt, options)
            .step('Startup the require manager module', base.startup)
            .step('Search for component dist files', search.files)
            .step('Process component folders', process.components)
            .step('Build static asset folders tasks', build.folderTasks)
            .step('Build the new requireJS settings file.', build.requireFile)
            .step('Build dynamic watch tasks if needed', build.watch)
            .step('Build mode based tasks', build.mode)
            .step('Generate the new grunt task orders', tasks.setOrder)
            .step('Close down the require manager module', base.closedown)
            .execute();
    });
};
