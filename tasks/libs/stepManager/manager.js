'use strict';

// Custom node modules

/**
* Manager:
* Responsible for building the init function and grunt variable spaces, providing an
* api to register tasks, and lastly executing those tasks in the specified order.
*
* Params:
* - none -
* @return - {object} - copy of all public functions used to manage require manager
*/
var manager = function () {
    /**
     * Private
     **/

    // Variables
    //=============

    var steps = [];

    /**
     * Init:
     * The starting point for the require manager process
     *
     * Params:
     * task - {object} - copy of the require manager task process
     * grunt - {object} - copy of the grunt object module
     * options - {object} - copy of the task options object
     * @return - {this} - copy of the manager object
     **/
    var init = function _init (task, grunt, options) {
        // Save off some instance variables
        this.task = task;
        this.grunt = grunt;
        this.options = options;

        // Debug logging
        // verbose.log(3, "Manager init ended!", 'debug');

        // Return the inited space
        return this;
    };

    /**
     * Step:
     * This is the api entry point for registering process steps
     *
     * Params:
     * title - {string} - proper title that is displayed while executing
     * func - {function} - step function
     * @return - {this} - copy of the manager object
     **/
    var step = function _step (title, func) {
        steps.push({
            title: title,
            func: func,
        });

        return this;
    };

    /**
     * Execute:
     * This is the api entry point for registering process steps
     *
     * Params:
     * [callback] - {function} - optional function that should be executed when all steps are completed.
     * @return - {boolean} - returns true when the entire process is finished.
     **/
    var execute = function _execute (callback) {
        // Make a copy of the manager for reference
        var self = this;

        // Check to see if there is anything to execute
        if (steps.length >= 1) {
            //verbose.log(3, "There are " + steps.length + " registered steps", "debug");
            // Pull the first step off the top
            var step = steps.shift();

            // If a title is defined display it.
            if (step.title) {
                //verbose.log(1, step.title);
            }

            // Execute this step and pass it what it will need to keep the step chain going
            step.func(self, function next (requrieManager) {
                // Check to see if more steps remain
                if (steps.length >= 1) {
                    // Get the next step
                    step = steps.shift();

                    // If a title is defined display it.
                    if (step.title) {
                        //verbose.log(1, step.title);
                    }

                    // Execute the next step
                    step.func(self, next);
                }
                else {
                    // Check to see if a callback was defined
                    if (callback) {
                        // It was so call it.
                        callback(null, true);
                    }

                    // End the entire require manager process
                    return true;
                }
            });
        }
        else {
            // Check to see if a callback was defined
            if (callback) {
                // It was so call it.
                callback(null, true);
            }

            // End the entire require manager process
            return true;
        }
    };

    // Return the public namespace
    return {
        init: init,
        step: step,
        execute: execute,
    };
};

// Expor the manager function as a module
module.exports = exports = new manager();
