define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');

    registerSuite({
        name: 'modal',

        'Modal 1 Button Exists': function () {
            return this.remote
                .get(require.toUrl('http://localhost:8888/tests/modal/pages/modal.html'))
                .setFindTimeout(5000)
                .execute(function(){

                    var $modalButton = $('#E_MODAL_BUTTON_1');

                    return{
                        modalButtonLength: $modalButton.length
                    }
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.modalButtonLength, 1, "Modal button does not exist");
                });                
        },

        'Modal 1 is visible when trigger is clicked': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('E_MODAL_BUTTON_1')
                    .click()
                    .sleep(500)
                    .end()
                .execute(function() {

                    var $modalButton = $('#E_MODAL_BUTTON_1');
                    var $modalData = $modalButton.data('modal');
                    var modalID = $modalData.$self[0].id;
                    var $modal = $("#" + modalID);

                    return{
                        modalHidden: $modal.hasClass('cui-hidden')
                    }
                })
                .then(function (returnObj) {
                   
                    assert.strictEqual(returnObj.modalHidden, false, "Modal should be visible");
                });
        },

        'Close Modal 1 by clicking on "X" control': function () {
            return this.remote
                .setFindTimeout(5000)
                .findDisplayedByClassName('cui-modal-hide')
                    .click()
                    .sleep(500)
                    .end()
                .execute(function() {

                    var $modalButton = $('#E_MODAL_BUTTON_1');
                    var $modalData = $modalButton.data('modal');
                    var modalID = $modalData.$self[0].id;
                    var $modal = $("#" + modalID);

                    return{
                        modalHidden: $modal.hasClass('cui-hidden')
                        
                    }
                })
                .then(function (returnObj) {
                   
                    assert.strictEqual(returnObj.modalHidden, true, "Modal should be hidden");
                });
        },

        //TODO: Can't seem to get the pressKeys method to work properly to trigger an escape press.
        // 'Close Modal 1 by pressing "ESCAPE"': function () {
        //     return this.remote
        //         .setFindTimeout(5000)
        //         .findById('E_MODAL_BUTTON_1')
        //             .click()
        //             .sleep(500)
                    
        //         .pressKeys(['ESCAPE'])
        //             .sleep(100000)
        //             .end()
        //         .execute(function() {

        //             var $modalButton = $('#E_MODAL_BUTTON_1');
        //             var $modalData = $modalButton.data('modal');
        //             var modalID = $modalData.$self[0].id;
        //             var $modal = $("#" + modalID);

        //             return{
        //                 modalHidden: $modal.hasClass('cui-hidden')
                        
        //             }
        //         })
        //         .then(function (returnObj) {
                   
        //             assert.strictEqual(returnObj.modalHidden, true, "Modal should be hidden");
        //         });
        // },

        'Close Modal 1 by clicking on overlay': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('E_MODAL_BUTTON_1')
                    .click()
                    .sleep(500)
                    .end()                
                .findDisplayedByClassName('cui-modal-overlay')
                    .moveMouseTo(10, 10)
                    .sleep(500)
                    .clickMouseButton()
                    .sleep(1000)
                    .end()
                .execute(function() {

                    var $modalButton = $('#E_MODAL_BUTTON_1');
                    var $modalData = $modalButton.data('modal');
                    var modalID = $modalData.$self[0].id;
                    var $modal = $("#" + modalID);

                    return{
                        modalHidden: $modal.hasClass('cui-hidden')
                    }
                })
                .then(function (returnObj) {
                   
                    assert.strictEqual(returnObj.modalHidden, true, "Modal should be hidden");
                });
        },

        'Opening Modal 4 and clicking on overlay should not close': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('E_MODAL_BUTTON_4')
                    .click()
                    .sleep(500)
                    .end()     
                .findDisplayedByClassName('cui-modal-overlay')
                    .moveMouseTo(10, 10)
                    .sleep(500)
                    .clickMouseButton()
                    .sleep(1000)
                    .end()
                .execute(function() {

                    var $modalButton = $('#E_MODAL_BUTTON_4');
                    var $modalData = $modalButton.data('modal');
                    var modalID = $modalData.$self[0].id;
                    var $modal = $("#" + modalID);

                    return{
                        modalHidden: $modal.hasClass('cui-hidden')
                    }
                })
                .then(function (returnObj) {
                   
                    assert.strictEqual(returnObj.modalHidden, false, "Modal should be visible");
                });
        },

        'Modal 4 should close by clicking on close button': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('E_MODAL_BUTTON_4_CLOSE')
                    .click()
                    .sleep(500)
                    .end()                
                .execute(function() {

                    var $modalButton = $('#E_MODAL_BUTTON_4');
                    var $modalData = $modalButton.data('modal');
                    var modalID = $modalData.$self[0].id;
                    var $modal = $("#" + modalID);

                    return{
                        modalHidden: $modal.hasClass('cui-hidden')
                    }
                })
                .then(function (returnObj) {
                   
                    assert.strictEqual(returnObj.modalHidden, true, "Modal should be hidden");
                });
        },

        'Modal C1 check for Header and Footer': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('E_MODAL_BUTTON_c1')
                    .click()
                    .sleep(1000)
                    .end()
                .execute(function() {

                    var $modalButton = $('#E_MODAL_BUTTON_c1');
                    var $modalData = $modalButton.data('modal');
                    var modalID = $modalData.$self[0].id;
                    var $modal = $("#" + modalID);
                    var $modalHeader = $modal.find('.cui-modal-header');
                    var $modalFooter = $modal.find('.cui-modal-footer');

                    return{
                        modalHeaderCount: $modalHeader.length,
                        modalFooterCount: $modalFooter.length

                    }
                })
                .then(function (returnObj) {
                   
                    assert.strictEqual(returnObj.modalHeaderCount, 1, "Modal header should be present");
                    assert.strictEqual(returnObj.modalFooterCount, 1, "Modal footer should be present");
                });
        },
        
    });
});

