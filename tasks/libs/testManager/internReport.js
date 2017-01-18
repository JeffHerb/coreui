const fs = require('fs');
const glob = require('glob');
const xml2js = require('xml2js');

var internReport = function _internReport() {

    var parser = new xml2js.Parser();

    var testPath = null;
    var testName = null;
    var reportingPath = null;

    var writableStream = null;
    var callback = null;

    var componentName = '';

    var finalFileName = "finalReport";

    var run = function run(logFile, cb){
        callback = cb;
        setComponentName(logFile);
        processLogFile(logFile);
    };

    var setComponentName = function(currentLog){
        var tmpName = currentLog;
        tmpName = tmpName.replace("./tests/","");
        tmpName = tmpName.replace("/report.xml","");
        componentName = tmpName;
    }

    var processLogFile = function _processLogFile(currentLog){
        fs.readFile(currentLog, function(err, data) {
            parser.parseString(data, function (err, result) {
                var resultText;
                if(result){
                    resultText = writeTestResults(result);
                }
                callback(resultText);
            });
        });
    };

    var addLineDepth = function _addLineDepth(depth, newLine){
        var padding = '';

        if(newLine){
            padding += '\n';
        }

        for(var i=0;i<depth;i++){
            padding += '\t';
        }

        return padding;
    };

    var writeTestResults = function _writeTestResults(jsResults){
        var reportText = "";
        var testSuite = jsResults["testsuites"].testsuite;
        var functionalTests = testSuite[0].testsuite;

        //Recursivally process for nested suites.
        var logDepth = 0;

        function writeSuite(suite){
            var suiteName = suite['$'].name;
            var suiteFailures = suite['$'].failures;
            var suiteTests = suite['$'].tests;

            reportText += addLineDepth(logDepth, true)+'Suite: ' + suiteName;
            reportText += addLineDepth(logDepth, true)+'Tests: ' +suiteTests;
            reportText += addLineDepth(logDepth, true)+'Failures: ' +suiteFailures;
            reportText += '\n';

            // Print Additional Suites
            if(suite.testsuite){
                logDepth++;
                for(var subSuiteIndex in suite.testsuite){
                    var subSuite = suite.testsuite[subSuiteIndex];
                    // console.log(subSuite);
                    writeSuite(subSuite);
                }
                logDepth--;
            }

            //Print any Tests
            if(suite.testcase){
                logDepth++;
                for (var testIndex in suite.testcase){
                    var test = suite.testcase[testIndex];
                    writeTest(test, testIndex);
                }
                logDepth--;
            }

            if(logDepth <= 0){
                reportText += '\n';
            }
        };

        function writeTest(test, testIndex){
            var testName = test['$'].name;
            var testStatus = test['$'].status;
            var testNumber = parseInt(testIndex) + 1;

            if(testStatus == 0){
                reportText += addLineDepth(logDepth)+testNumber+') Pass - ' + testName;
            }else if(testStatus == 1){

                //Handle Test Failures
                reportText += addLineDepth(logDepth)+testNumber+') Fail - ' + testName;

                var testFailures = test['failure'];
                var failureMessage;
                for(var failureIndex in testFailures){
                    failureMessage = testFailures[failureIndex]['$'].message;
                    failureMessage = failureMessage.split(':',1)[0];
                    reportText += addLineDepth(logDepth+1, true)+'Message: ' + failureMessage;
                }
            }
            reportText += '\n';
        };

        reportText += addLineDepth(logDepth, true)+'Component: ' + componentName;

        //Test Suite
        for(var suiteIndex in functionalTests){
            var suite = functionalTests[suiteIndex];
            writeSuite(suite);
        }

        if(writableStream){
            writableStream.write(reportText);
            writableStream.end();
        }

        return reportText;
    };

    var createGlobalReport = function _createGlobalReport(globalLogs, cb){
        //Format Date Object
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hours = date.getHours();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        var minutes = date.getMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes();

        var finalReportText = 'Intern Test Results - ';
        finalReportText += month + '/' + day + '/' + year;
        finalReportText +=  ' - ' + hours + ':' + minutes + ampm + '\n';

        var reportStream = fs.createWriteStream('./tests/'+finalFileName+'.txt');

        for(var logIndex in globalLogs){
            if(globalLogs[logIndex]){
                finalReportText += globalLogs[logIndex];
            }
            else{
                finalReportText += '<p>Error Creating Log.<p/>';
            }
            finalReportText += "\n----------\n";
        }

        reportStream.write(finalReportText, function(){
            reportStream.close();
            reportStream.end();
            cb();
        });
    };

    return{
        run: run,
        createGlobalReport: createGlobalReport,
    }
}

module.exports = exports = new internReport();
