'use strict';

var fs = require('../utilities/fs');

var base = function _base () {
    var closedown = function _close_down (rm, next) {
        // Snag a copy of the entire grunt config
        var gruntConfig = rm.grunt.config.get();

        delete gruntConfig.componentFinder;

        // Save it off for debug reasons.
        fs.writeJSON('tasks/libs/requireManager/logs/dynamic-config.json', gruntConfig);

        // Save off the taskRunList
        fs.writeJSON('tasks/libs/requireManager/logs/task-run-list.json', {'tasks': rm.options.taskRunList});

        // Write out the final component defs we created from both componentFinder and requireManager
        fs.writeJSON('tasks/libs/requireManager/logs/component-definitions.json', rm.options.components);

    };

    var startup = function _startup (rm, next) {
        var componentFinderConfig = rm.grunt.config.get('componentFinder');

        if (componentFinderConfig !== undefined && componentFinderConfig !== null) {

            // Move value into its own options set
            (function nextOption (options) {
                var optionName = options.shift();

                rm.options[optionName] = componentFinderConfig[optionName];

                if (options.length !== 0) {
                    nextOption(options);
                }
                else {
                    next(rm);
                }
            })(Object.keys(componentFinderConfig));

        }
        else {
            next(false);
        }
    };

    return {
        closedown: closedown,
        startup: startup,
    };
};

// Export the manager function as a module
module.exports = exports = new base();
