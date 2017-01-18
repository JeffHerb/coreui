define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');

    registerSuite({
        name: 'popover',

        'Popover Below Left 1 Button Exists': function () {
            return this.remote
                .get(require.toUrl('http://localhost:8888/tests/popover/pages/popover.html'))
                .setFindTimeout(5000)
                .execute(function(){

                    var $modalButton = $('#E_POPOVER_BL_1');

                    return{
                        modalButtonLength: $modalButton.length
                    }
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.modalButtonLength, 1, "Modal button does not exist");
                });                
        },

       'Verify popover displayed': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('E_POPOVER_BL_1')
                    .click()
                    .sleep(1000)
                    .end()
                .findDisplayedByClassName('cui-popover')                
                .then(function (returnObj) {                   
                    assert.isDefined(returnObj, "Popover should be visible");
                });
        },

        'Verify popover stays visible on click': function () {
            return this.remote
                .setFindTimeout(5000)
                .findDisplayedByClassName('cui-popover') 
                    .moveMouseTo(10, 10)   
                    .click()
                    .sleep(1000)
                    .end()
                .findDisplayedByClassName('cui-popover') 
                .then(function (returnObj) {                   
                    assert.isDefined(returnObj, "Popover should be visible");
                });
        },

        'Click on page to close popover': function () {
            return this.remote
                .setFindTimeout(5000)
                .findDisplayedByClassName('cui-popover') 
                    .moveMouseTo(0,-10)   
                    .click()   
                    .sleep(1000)         
                .then(function (returnObj) {                   
                    assert.isUndefined(returnObj, "Popover should be hidden");
                });
        },

        'Verify popover displayed': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('E_POPOVER_BL_1')
                    .click()
                    .sleep(1000)
                    .end()
                .findDisplayedByClassName('cui-popover')                
                .then(function (returnObj) {                   
                    assert.isDefined(returnObj, "Popover should be visible");
                });
        },

        'Verify popover is hidden on scroll': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('scrollTo')
                    .moveMouseTo()
                    .sleep(1000)
                    .end()
                .findByClassName('cui-popover')
                .isDisplayed()                
                .then(function (returnObj) {                   
                    assert.equal(returnObj, false, "Popover should be hidden");
                });
        },

    });
});