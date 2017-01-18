module.exports = function (grunt) {
    'use strict';

    /*
     * Configuration Debug:
     */

    // Constants
    var TASK_DESCRIPTION = 'Get additional information from the config debug too.';

    // Step Manager
    var manager = require('./libs/stepManager/manager');

    // Task Steps
    var output = require('./libs/configDebug/output');

    // Define the Grunt Multitask for the Require Manager Task;
    grunt.registerTask('configDebug', TASK_DESCRIPTION, function () {
        var options = {};

        // Call the manager and execute the following steps.
        manager.init(this, grunt, options)
            .step('Startup the component finder module', output.gruntConfig)
            .execute();
    });
};
