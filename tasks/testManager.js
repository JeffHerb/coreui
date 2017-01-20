/*
 * Special Credit to:
 * https://github.com/zs-zs/grunt-selenium-standalone/
 * https://github.com/vvo/selenium-standalone/
 * ===================================================================
 * As these projects structure and style inspired this managers design
 */
module.exports = function (grunt) {
	'use strict';

	var TASK_DESCRIPTION = 'Test Manager for Core UI.';

    var systemOptions;
	var seleniumOptions;
    var seleniumPid;

    // Component Loader Librarys
    var check = require('./libs/testManager/check');

    // Native node modules
    var fs = require('fs');
    var spawn = require('child_process').spawn;

    // Utility Modules
    var ufs = require('./libs/utilities/fs');

    // Third party modules
    var kill = require('tree-kill');

    // Intern Reporter Library
    var internReporter = require('./libs/testManager/internReport');
    var glob = require('glob');

    // Define the Grunt Multitask for the Require Manager Task;
	grunt.registerTask('testManager', TASK_DESCRIPTION, function () {
		var done = this.async();

		var options = {
			'system': {},
   			'proxy': false,
			'testMode': 'local',
			'selenium': {
				'port': 4444,
				'basePath': './tasks/libs/testManager/selenium/',
				'server': {
					'version': '2.53.1',
					'url': 'https://selenium-release.storage.googleapis.com/',
					'file': 'selenium-server-standalone-',
					'ext': '.jar'
				},
				'drivers': {
					'chrome': {
						'version': '2.25',
						'url': 'https://chromedriver.storage.googleapis.com/',
						'file': 'chromedriver_',
						'ext': '.zip'
					}
					// 'ie': {
					// 	'url': 'https://selenium-release.storage.googleapis.com/',
					// 	'version': '2.53.1',
					// 	'file': 'IEDriverServer_',
					// 	'ext': '.zip'
					// }
				}
			}
		};

        // Remove path module if it is present
        grunt.task.run([
            'clean:test'
        ]);

        if(grunt.option('testQuiet')){
            console.log('Quiet run, disabling the Grunt log until the intern tasks are run. console.log will still display.\n');

            var shadowLog = Object.create(process.stdout);
            shadowLog.write = function(output){
                if(output.indexOf('Running "intern')>=0){
                    console.log(output);
                    grunt.log.options.outStream = process.stdout;
                }
            }
            grunt.log.options.outStream = shadowLog;
        }

        if(grunt.option('testReport')){
            grunt.task.run([
                'clean:testReports'
            ]);
        }

		if (options.testMode === 'local') {
			// Start by checking to make sure the current test port is not in use
			check.port(grunt, options, function (portTest) {
				if (portTest) {
					// Check to make sure java is installed
					check.java(function (test) {
						if (test) {
							// Since the port is avaliable, move to checking the files needed to run a local server
							check.files(grunt, options, function (fileTest) {
								if (fileTest) {
                                    seleniumOptions = options.selenium;
                                    systemOptions = options.system;

                                    // Turning on force because test may fail.
                                    grunt.option('force', true);

									// Ass the task to start selenium and call a production build
									grunt.task.run(['connect', 'startSelenium', 'prod']);

                                    //grunt.task.run(['startSelenium']);

									done(true);
								}
								else {
									console.log('Failed to downloaded the needed resources to run a local server.');
								}
							});
						}
						else {
							console.log('Failed on java check');
						}
					});
				}
				else {
					console.log('Failed to launch test as port is in use already: ' + options.selenium.port);
				}
			});
		}
		else {
			console.log('Future expansion into external testing would be awesome, but not just there yet!');
		}
	});

    // Define the Grunt task for starting the selenium server for the Require Manager Task;
	grunt.registerTask('startSelenium', 'Starts a selenium server', function () {
        // Ouput log
        var out = fs.openSync('./tasks/libs/testManager/selenium-out.log', 'a');
        var err = fs.openSync('./tasks/libs/testManager/selenium-err.log', 'a');

        // Standard java arguments
        var javaArgs = ['-jar', seleniumOptions.server.fullPath];

        // Compile a driver list
        var drivers = Object.keys(seleniumOptions.drivers);

        // Loop through and build the driver extensions filenames
        for (var i = 0, len = drivers.length; i < len; i++) {
            var fileName =  seleniumOptions.drivers[drivers[i]].file;

            // Add the missing extension for windows users
            if (systemOptions.os === 'windows') {
                fileName += '.exe';
            }

            javaArgs.push('-Dwebdriver.' + drivers[i] + '.driver=' + ufs.pathJoin(seleniumOptions.drivers[drivers[i]].basePath, fileName));
        }

        // Spawn the Java child
        var child = spawn('java', javaArgs, {
            detached: true,
            stdio: [
                'ignore',
                out,
                err,
            ],
        });

        // Save off the pid
        seleniumPid = child.pid;

        // Unrefernece the child
        child.unref();

        console.log('Selenium Server has been started in the background!');
	});

    // Define the Grunt Multitask for the Require Manager Task;
	grunt.registerTask('stopSelenium', 'Stop a selenium server', function () {
        var done = this.async();

        kill(seleniumPid, 'SIGKILL', function (err) {
            console.log('Selenium Server has stopped!');

            done(true);
        });
	});

    //Compile each intern report from the test run and compile to a single final report.
    grunt.registerTask('writeInternReport', 'Create Intern Report', function () {
        var done = this.async();
        var components = '';

        var testPath = "./tests";
        var reportFile = "report.xml";

        var testReports = [];
        var globalLogs = [];

        function nextReport(testReports) {
            var report = testReports.shift();

            internReporter.run(report, function(logs) {
                globalLogs.push(logs);
                if (testReports.length) {
                    nextReport(testReports);
                }
                else {
                    (
                        function createGlobalReport() {
                            internReporter.createGlobalReport(globalLogs,function(){
                                done(true);
                            });
                        }
                    )();
                }
            });
        }

        var cmdRunTests = grunt.option('runTests');

        if(cmdRunTests && typeof cmdRunTests != 'boolean'){
            components = grunt.option('runTests');
        }

        // process components cli value
        if(components.indexOf('[') > -1 && components.indexOf(']')>-1){
            //Possible array of values. Update to parse 'array'
            components = components.replace('[', '');
            components = components.replace(']', '');

            if(components.indexOf(',') > -1){
                components = components.split(',');
            }
        }else if(typeof components !== 'string'){
            //Invalid value reset to empty value
            components = "";
        }

        if(components == "" || components == null){
            var globPath = testPath + "/**/report.xml";

            glob(globPath, '', function (er, files) {

                var timestamps = [];
                var oldLogs = [];
                var fileIndex;

                for(fileIndex in files){
                    testReports.push(files[fileIndex]);
                }
                nextReport(testReports);
            });
        }
        else if(typeof components === 'string'){
            testReports.push(testPath +"/"+ components + "/" + reportFile);
            nextReport(testReports);
        }
        else if (typeof components === 'object'){
            for(var i=0; i<components.length;i++){
                testReports.push(testPath +"/"+ components[i] + "/" + reportFile);
            }
            nextReport(testReports);
        }
        else{
            done(true);
        }

    });
};
