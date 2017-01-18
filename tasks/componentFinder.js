module.exports = function (grunt) {
    'use strict';

    /*
     * Component Finder:
     * Component finder is a Core UI module grunt task used to search a specific src/project, src/cui folder structure to discover modular components used by the Core UI framework.
     */

    // Constants
    var TASK_DESCRIPTION = 'Component Finder for Core UI';

    // Step Manager
    var manager = require('./libs/stepManager/manager');

    // Component Loader Librarys
    var base = require('./libs/componentFinder/base');
    var build = require('./libs/componentFinder/build');
    var search = require('./libs/componentFinder/search');
    var process = require('./libs/componentFinder/process');

    // Define the Grunt Multitask for the Require Manager Task;
    grunt.registerTask('componentFinder', TASK_DESCRIPTION, function () {
        var options = {
            srcFolder: 'src',
            rootFolders: ['cui', 'project'],
            assetTypes: ['components', 'libs'],
            priorityRoot: 'project',
            componentFolders: [],
            undefinedAssetProcess: 'include',
            keyFiles: {
                settings: 'asset.json',
                build: 'Gruntfile.js',
                pack: 'package.json',
            },
            excludes: {
                folders: [
                    '.git',
                    'dist',
                    'node_modules',
                    'tasks',
                    'tests',
                ],
                files: [
                    '_settings.scss',
                    'asset.json',
                    '.gitignore',
                    '.editorconfig',
                    'componentBuild.js',
                    'Gruntfile.js',
                    'npm-modules.log',
                    'package.json'
                ],
                filesExtensions: [
                    'bak',
                    'old',
                    'db'
                ],
                buildTasks: [
                    'connect',
                    'watch',
                    'intern',
                ],
            },
        };

        // Call the manager and execute the following steps.
        manager.init(this, grunt, options)
            .step('Startup the component finder module', base.startup)
            .step('Search for component folders', search.folders)
            .step('Process component folders', process.folders)
            .step('Build new grunt tasks for components with builds', build.tasks)
            .step('Close down the component finder module', base.closedown)
            .execute();
    });
};
