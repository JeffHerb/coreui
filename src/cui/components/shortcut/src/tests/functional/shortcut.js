define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');

    registerSuite({
        name: 'shortcut',

        'Shortcut legend does not exist': function () {
            return this.remote
                .get(require.toUrl('http://localhost:8888/tests/shortcut/pages/shortcut.html'))
                .setFindTimeout(5000)
                .execute(function(){

                    var $modal = $('.cui-modal');

                    return{
                        modalLength: $modal.length
                    }
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.modalLength, 0, "Shortcut Legend modal element should not be present");
                });
        },

        'Shortcut legend exists after key combo press': function () {
            return this.remote
                .setFindTimeout(5000)
                .pressKeys(['?', 'NULL'])
                    .sleep(500)
                    .end()
                .execute(function() {

                    var $modal = $('.cui-modal');

                    return{
                        modalLength: $modal.length
                    }
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.modalLength, 1, "Shortcut Legend modal element should be present");
                });
        },

        'Close shortcut legend': function () {
            return this.remote
                .setFindTimeout(5000)
                .findDisplayedByClassName('cui-modal-hide')
                    .click()
                    .sleep(500)
                    .end()
                .execute(function(){

                    var $modalHidden = $('.cui-modal');

                    return{
                        modalHiddenLength: $modalHidden.length
                    }
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.modalHiddenLength, 0, "Shortcut Legend modal element should not exist");
                });
        },

        'Reload page to clear hidden modals': function () {
            return this.remote
                .setFindTimeout(5000)
                .refresh()
        },

        'Select input and try to trigger shortcut, should be suppressed.': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('exampleInput')
                    .click()
                    .sleep(500)
                    .pressKeys(['?', 'NULL'])
                        .sleep(500)
                        .end()
                .execute(function() {

                    var $modal = $('.cui-modal');

                    return{
                        modalLength: $modal.length
                    }
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.modalLength, 0, "Shortcut Legend modal element should not have been created");
                });
        },

    });
});

