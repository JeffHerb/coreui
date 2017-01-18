'use strict';

// Custom node modules
var fs = require('../utilities/fs');

var _priv = {};

var process = function _process() {

    var folders = function _folders(rm, next) {

        var options = rm.options;
        var grunt = rm.grunt;
        var buildComponents = [];

        (function nextComponent(components) {

            var componentName = components.shift();
            var componentDef = rm.options.components[componentName];

            var removeFilesDefs = [];
            var removeComp = false;

            // Loop through the source files for this component
            var files = componentDef.sourceFiles.concat();

            // Initial values
            componentDef.settings = false;
            componentDef.build = false;
            componentDef.pack = false;

            // First, lets loop through the files and expand the components per requirements.
            (function nextFile(files, count) {

                var file = files.shift();

                // Check the files to for key files.
                switch (file.name) {

                    // Asset.json
                    case options.keyFiles.settings:

                        componentDef.settings = grunt.file.readJSON(file.fullpath);

                        // Since we add pulled these value into the def, we dont need the file anymore
                        removeFilesDefs.push(count);
                        break;

                    // Package.json
                    case options.keyFiles.pack:

                        componentDef.pack = grunt.file.readJSON(file.fullpath);

                        // Since we add pulled these value into the def, we dont need the file anymore
                        removeFilesDefs.push(count);
                        break;

                    // Gruntfile.js
                    case options.keyFiles.build:

                        // Read the grunt file in and do some cleanup to just get the object
                        var fileContents = grunt.file.read(file.fullpath);

                        var gruntInitRegEx = /(grunt.initConfig\()([\s\S]*)\}\)\;/g;

                        fileContents = fileContents.match(gruntInitRegEx)[0].replace("grunt.initConfig(","");
                        fileContents = fileContents.substring(0, fileContents.length -2);

                        // Remove package json if its part of the file:
                        fileContents = fileContents.replace(/pkg\: grunt.file.readJSON\([\'\"]package.json[\'\"]\)\,/g, '');

                        fileContents = "module.exports = function() { return " + fileContents;
                        fileContents += ";}";

                        var newFilePath = fs.pathJoin("tasks/libs/componentFinder/temp/", componentName + ".js");

                        // Write this file out for later.
                        grunt.file.write(newFilePath, fileContents);

                        componentDef.build = true;

                        buildComponents.push(componentName);

                        break;
                }

                if (files.length !== 0) {

                    nextFile(files, count + 1);
                }

            })(files, 0);

            // Check to see if we have a setting file
            if (componentDef.settings !== false) {

                // Check to see if the developer has disabled a module/component
                if ((componentDef.settings.hasOwnProperty('disable') && componentDef.settings.disable === false) || !componentDef.settings.hasOwnProperty('disable')) {

                    // Check for lazy load setting
                    if (componentDef.settings.hasOwnProperty('lazy')) {

                        // Set the include method
                        componentDef.includeMethod = (componentDef.settings.lazy) ? 'lazy' : 'include';
                    }

                }
                else {

                    removeComp = true;
                }
            }
            else {

                // So lets add additional propeties as defaults
                componentDef.includeMethod = 'include';
            }

            // Check to see if we have to remove files
            if (removeFilesDefs.length !== 0) {

                // Reverse that array because we have to go from the last to the first so the right files are removed.
                removeFilesDefs = removeFilesDefs.reverse();

                // Loop through all of the files that need to be removed.
                for (var i = 0, len = removeFilesDefs.length; i < len; i++) {

                    // Remove the object
                    componentDef.sourceFiles.splice(removeFilesDefs[i], 1);
                }

                // Double check to make sure we still have files, if we dont mark it for removal
                if (componentDef.sourceFiles.length === 0) {

                    removeComp = true;
                }
            }

            // Check to see if the component should be removed
            if (removeComp) {

                delete rm.options.components[componentName];
            }
            else {

                // Update this componentDef
                rm.options.components[componentName] = componentDef;
            }

            if (components.length !== 0) {

                nextComponent(components);
            }
            else {

                // we have som config updates
                rm.options['buildComponents'] = buildComponents;

                next(rm);
            }

        })(Object.keys(rm.options.components));

    }

    return {
        folders: folders
    }

}

module.exports = exports = new process();
