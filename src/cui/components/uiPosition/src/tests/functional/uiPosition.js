define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');

    registerSuite({
        name: 'uiPosition',

        'Check Position Block not positioned': function () {
            return this.remote
                .get(require.toUrl('http://localhost:8888/tests/uiPosition/pages/uiPosition.html'))
                .setFindTimeout(5000)
                .execute(function() {
                    
                    var $uiBlock = $('#UIPOSITION_BLOCK');

                    return {
                        uiBlockCSSPosition: $uiBlock.css('position')
                    };
                })
                .then(function (returnObj) {
                    assert.notEqual(returnObj.uiBlockCSSPosition, "fixed", "Test Block should not start positioned.");
                });
        },

        'Position Top Left': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('TOP_LEFT')
                    .click()
                    .end()
                .execute(function() {

                    var $uiBlock = $('#UIPOSITION_BLOCK');

                    return {
                        uiBlockOffset: $uiBlock.offset()
                    };
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.uiBlockOffset.left, 10, "Should be 10 px to the left");
                    assert.strictEqual(returnObj.uiBlockOffset.top, 10, "Should be 10 px to the top");
                });
        },
         
        'Position Top Center': function () {
            return this.remote
                .setFindTimeout(5000)                
                .findById('TOP_CENTER')
                    .click()
                    .end()
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');
                    
                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        windowWidth: $window.width()
                    };
                })
                .then(function (returnObj) {
                    assert.strictEqual((returnObj.uiBlockOffset.left + 0.5 * returnObj.uiBlockWidth), (0.5 * returnObj.windowWidth), "Should be centered horizontally");

                    assert.strictEqual(returnObj.uiBlockOffset.top, 10, "Should be 10 px to the top");
                });
        },
        
        'Position Top Right': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('TOP_RIGHT')
                    .click()
                    .end()
                .setFindTimeout(1000)
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');

                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        windowWidth: $window.width()
                    };
                })
                .then(function (returnObj) {
                    assert.strictEqual((returnObj.uiBlockOffset.left + returnObj.uiBlockWidth), (returnObj.windowWidth - 10), "Should be 10 px to the right");

                    assert.strictEqual(returnObj.uiBlockOffset.top, 10, "Should be 10 px to the top");
                });
        },

       
        'Position Center Left': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('CENTER_LEFT')
                    .click()
                    .end()
                .setFindTimeout(1000)
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');
                    
                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        uiBlockHeight: $uiBlock.outerHeight(),
                        windowWidth: $window.width(),
                        windowHeight: $window.height()
                    };
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.uiBlockOffset.left, 10, "Should be 10 px to the left");

                    assert.strictEqual((returnObj.uiBlockOffset.top + 0.5 * returnObj.uiBlockHeight), (0.5 * returnObj.windowHeight), "Should be centered vertically");
                });
        },

        'Position Center Center': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('CENTER_CENTER')
                    .click()
                    .end()
                .setFindTimeout(1000)
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');
                    
                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        uiBlockHeight: $uiBlock.outerHeight(),
                        windowWidth: $window.width(),
                        windowHeight: $window.height()
                    };
                })
                .then(function (returnObj) {
                     assert.strictEqual((returnObj.uiBlockOffset.left + 0.5 * returnObj.uiBlockWidth), (0.5 * returnObj.windowWidth), "Should be centered horizontally");

                    assert.strictEqual((returnObj.uiBlockOffset.top + 0.5 * returnObj.uiBlockHeight), (0.5 * returnObj.windowHeight), "Should be centered vertically");
                });
        },

        'Position Center Right': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('CENTER_RIGHT')
                    .click()
                    .end()
                .setFindTimeout(1000)
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');
                    
                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        uiBlockHeight: $uiBlock.outerHeight(),
                        windowWidth: $window.width(),
                        windowHeight: $window.height()
                    };
                })
                .then(function (returnObj) {
                    assert.strictEqual((returnObj.uiBlockOffset.left + returnObj.uiBlockWidth), (returnObj.windowWidth - 10), "Should be 10 px to the right");

                    assert.strictEqual((returnObj.uiBlockOffset.top + 0.5 * returnObj.uiBlockHeight), (0.5 * returnObj.windowHeight), "Should be centered vertically");
                });
        },

        'Position Bottom Left': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('BOTTOM_LEFT')
                    .click()
                    .end()
                .setFindTimeout(1000)
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');
                    
                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        uiBlockHeight: $uiBlock.outerHeight(),
                        windowWidth: $window.width(),
                        windowHeight: $window.height()
                    };
                })
                .then(function (returnObj) {
                    assert.strictEqual(returnObj.uiBlockOffset.left, 10, "Should be 10 px to the left");

                    assert.strictEqual((returnObj.uiBlockOffset.top + returnObj.uiBlockHeight), (returnObj.windowHeight - 10), "Should be 10 px to the bottom");
                });
        },

        'Position Bottom Center': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('BOTTOM_CENTER')
                    .click()
                    .end()
                .setFindTimeout(1000)
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');
                    
                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        uiBlockHeight: $uiBlock.outerHeight(),
                        windowWidth: $window.width(),
                        windowHeight: $window.height()
                    };
                })
                .then(function (returnObj) {
                    assert.strictEqual( (returnObj.uiBlockOffset.left + 0.5 * returnObj.uiBlockWidth), (0.5 * returnObj.windowWidth), "Should be centered horizontally");

                    assert.strictEqual(returnObj.uiBlockOffset.top + returnObj.uiBlockHeight, returnObj.windowHeight - 10, "Should be 10 px to the bottom");
                });
        },

        'Position Bottom Right': function () {
            return this.remote
                .setFindTimeout(5000)
                .findById('BOTTOM_RIGHT')
                    .click()
                    .end()
                .setFindTimeout(1000)
                .execute(function() {
                    
                    var $window = $(window);
                    var $uiBlock = $('#UIPOSITION_BLOCK');
                    
                    return {
                        uiBlockOffset: $uiBlock.offset(),
                        uiBlockWidth: $uiBlock.outerWidth(),
                        uiBlockHeight: $uiBlock.outerHeight(),
                        windowWidth: $window.width(),
                        windowHeight: $window.height()
                    };
                })
                .then(function (returnObj) {
                     assert.strictEqual((returnObj.uiBlockOffset.left + returnObj.uiBlockWidth), (returnObj.windowWidth - 10), "Should be 10 px to the right");

                    assert.strictEqual((returnObj.uiBlockOffset.top + returnObj.uiBlockHeight), (returnObj.windowHeight - 10), "Should be 10 px to the bottom");
                });
        },
        
    });
});

