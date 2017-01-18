'use strict';

var fs = require('../utilities/fs');

var base = function _base() {

    var closedown = function _close_down(rm, next) {

        // Snag a copy of the entire grunt config
        var gruntConfig = rm.grunt.config.get();

        var componentFinderConfig = rm.grunt.config.get('componentFinder');

        if (componentFinderConfig === undefined || componentFinderConfig === null) {

            rm.grunt.config.set('componentFinder', {});

            componentFinderConfig = {};
        }

        // Save of the original grunt config
        componentFinderConfig.originalGrunt = rm.originalGrunt;

        // Indicates if requireManager needs to be included.
        var requireManager = false;

        // Save it off for debug reasons.
        fs.writeJSON('tasks/libs/componentFinder/logs/dynamic-config.json', gruntConfig);

        var components = Object.keys(rm.options.components);

        if (components.length !== 0) {

            // Mark that require manager will need to run
            requireManager = true;

            // Save of all the component definitions so require manager can get them
            componentFinderConfig.components = rm.options.components;

            // Loop throug the component folders once last time
            (function nextComponent(components) {

                var componentName = components.shift();
                var componentDef = rm.options.components[componentName];

                if (componentDef.buildTask) {

                    if (!componentFinderConfig.buildComponents) {

                        componentFinderConfig.buildComponents = [];
                    }

                    // Push the component name into the list.
                    componentFinderConfig.buildComponents.push(componentName);

                }

                if (components.length !== 0) {

                    nextComponent(components);
                }
                else {

                    // Save the componentFinderConfig.
                    rm.grunt.config.set('componentFinder', componentFinderConfig)

                    if (requireManager) {

                        // Execute require Manager
                        rm.grunt.task.run('requireManager');

                    }

                    next(rm);
                }

            })(Object.keys(rm.options.components));

        }

    };

    var startup = function _startup(rm, next) {

        // Get a copy of the original grunt config
        rm.originalGrunt = rm.grunt.config.get();

        next(rm);

    };

    return {
        closedown: closedown,
        startup: startup
    }

}

// Export the manager function as a module
module.exports = exports = new base();
