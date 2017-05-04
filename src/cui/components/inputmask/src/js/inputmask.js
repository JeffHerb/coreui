define(['jquery', 'cui'], function ($, cui) {
    /////////////
    // Globals //
    /////////////

    const NAMESPACE = 'inputmask';
    const VERSION = '1.0.0';
    const ATTR_NAMES = {
        origType: 'data-' + NAMESPACE + '-type',
        toggleIdSuffix: '_toggle'
    };


    /////////////
    // Private //
    /////////////

    const _priv = {}; // Namespace for private methods

    // Internal flags
    const isTouch = false;
    const inputs = {}; // List of tracked inputs

    const CLASSES = {
        inputParent: 'cui-' + NAMESPACE, // e.g. `<div class="cui-field">` which contains the input to be masked
        input: NAMESPACE + '-input',
        toggleWrapper: NAMESPACE + '-toggle-wrapper'
    };

    const SELECTORS = {
        inputsToMask: '.' + CLASSES.inputParent + ' .dataPn input,' + // Standard input field in a group
                      'td.' + CLASSES.inputParent + ' > input,'     + // In a table
                      '.' + CLASSES.inputParent + '.row-r input'      // In a form table
    };

    const setup = function setup () {
        // Make sure the browser is capable of changing an input's type and that it can query for the more advanced selector needed to find matching input fields
        if (!canSetInputAttribute()) {
            return false;
        }

        // isTouch = (du.browser.isSmallScreen && Modernizr.touch);
    };

    const teardown = function teardown (items) {
        let configs = {};

        // Check for specific items to tear down
        if (items && du.typeOf(items) === 'array') {
            // console.log('tearing down specific masked inputs');
            // Get the settings object for each one
            items.forEach(function (input) {
                if (input.id && inputs[input.id] && inputs.hasOwnProperty(input.id)) {
                    configs[input.id] = inputs[input.id];
                }
                else {
                    // console.error('cannot tear down ', input);
                }
            });
        }
        // Tear down all known inputs
        else {
            // console.log('tearing down all masked inputs');
            configs = inputs;
        }

        // Tear down each element
        for (let config in configs) {
            if (configs.hasOwnProperty(config)) {
                config = configs[config];
                // console.warn('tearing down ', config);

                // Remove DOM elements
                config.wrapper.removeChild(config.cbox);
                config.wrapper.removeChild(config.label);
                config.wrapper.parentNode.removeChild(config.wrapper);

                // Remove stored settings
                inputs[config.input.id] = null;
            }
        }
    };

    /////////////////////
    // Private methods //
    /////////////////////

    /**
     * Creates a toggler UI
     *
     * @param   {Object}  settings  Settings object
     *
     * @return  {Object}            Updated Setting with the new UI elements defined
     */
    const createToggle = function createToggle (settings) {
        settings.wrapper = document.createElement('div');

        // Toggle controls wrapper
        settings.wrapper.className = CLASSES.toggleWrapper;

        // Setup checkbox
        settings.cbox = document.createElement('input');
        settings.cbox.type = 'checkbox';
        settings.cbox.id = settings.input.id + ATTR_NAMES.toggleIdSuffix;
        settings.cbox.checked = true;
        settings.cbox.setAttribute('tabindex', '1');
        settings.cbox.addEventListener('change', _events.onTogglerChange, false);

        // Label
        settings.label = document.createElement('label');
        settings.label.innerHTML = 'Hide';
        settings.label.htmlFor = settings.cbox.id;
        settings.label.setAttribute('role', 'button');

        // Add label and check box to the wrapper
        settings.wrapper.appendChild(settings.cbox);
        settings.wrapper.appendChild(settings.label);

        // Add the wrapper right after the input
        settings.wrapper = settings.input.parentNode.insertBefore(settings.wrapper, settings.input.nextSibling);

        // Update stored settings
        inputs[settings.input.id] = settings;

        return settings;
    };

    /**
     * Updates the toggler label text to reflect the current state
     *
     * @param  {String}  settings  The new label text
     */
    const setLabelText = function setLabelText (settings) {
        var state = settings.cbox.checked ? 'show' : 'hide';

        settings.label.innerHTML = settings.labelText[state];

        return settings.labelText[state];
    };

    /**
     * Masks the input's value like a password
     *
     * @param   {Object}  settings  Settings object
     *
     * @return  {Boolean}           Success/failure
     */
    const enableMask = function enableMask (settings) {
        // Change input type to make value unreadable
        settings.input.type = 'password';

        // Update button
        setLabelText(settings);

        return true;
    };

    /**
     * Makes the input's value readable
     *
     * @param   {Object}  settings  Settings object
     *
     * @return  {Boolean}           Success/failure
     */
    const disableMask = function disableMask (settings) {
        // Revert input type so the value is readable
        // if (isTouch) {
        //     settings.input.type = settings.touchType;
        // }
        // else {
            settings.input.type = settings.type;
        // }

        // Update button
        setLabelText(settings);

        return true;
    };

    /**
     * Toggle a field's masking
     * @param   {Object}  settings  Field settings
     *
     * @return  {Number}            1 for masking, 2 for unmasking
     */
    const toggleMask = function toggleMask (settings) {
        // Change from shown -> masked
        if (settings.cbox.checked) {
            enableMask(settings);
            setFocus(settings);

            return 1;
        }
        // Change from masked -> shown
        else {
            disableMask(settings);
            setFocus(settings);

            return 2;
        }

        return -1;
    };

    /**
     * Set focus to an input field
     *
     * @param  {Object}  settings  Settings object
     */
    const setFocus = function priv_setFocus (settings) {
        try { // This sometimes fails on various browsers for various difficult-to-determine reasons (3/24/2015 CP)
            settings.input.focus();
        }
        catch (e) {
            // console.error(e);
        }
    };

    /**
     * Test whether the browser can change `<input type>` dynamically so we know whether this plugin will work
     *
     * Taken from https://github.com/cloudfour/hideShowPassword/blob/master/hideShowPassword.js
     *
     * @return  {Boolean}  Whether the browser can set an input's type
     */
    const canSetInputAttribute = function canSetInputAttribute () {
        let body = document.body;
        let input = document.createElement('input');
        let result = true;

        // IE 8 is a false positive so we have to weed it out manually
        // See https://stackoverflow.com/a/6910617
        if (window.attachEvent && !window.addEventListener) {
            return false;
        }

        if (!body) {
            body = document.createElement('body');
        }

        input = body.appendChild(input);

        try {
            input.setAttribute('type', 'text');
        }
        catch (e) {
            result = false;
        }

        body.removeChild(input);

        return result;
    };


    ////////////
    // Events //
    ////////////

    const _events = {};

    /**
     * Handles interaction with the toggler
     *
     * @param   {Event}  evt   Click or change event
     */
    _events.onTogglerChange = function _onTogglerChange (evt) {
        var input = evt.target;
        var settings = inputs[input.id.replace(ATTR_NAMES.toggleIdSuffix, '')];

        toggleMask(settings);
    };


    ////////////
    // Public //
    ////////////

    var Inputmask = function (elem, options) {
        if (elem instanceof Node) {
            // Store the element upon which the component was called
            this.elem = elem;
            // Create a jQuery version of the element
            // this.$self = $(elem);

            this.$button = $(elem);

            // This next line takes advantage of HTML5 data attributes
            // to support customization of the plugin on a per-element
            // basis. For example,
            // <div class="item" data-inputmask-options="{'message':'Goodbye World!'}"></div>
            this.metadata = this.$button.data('inputmask-options');
        }
        else {
            this.metadata = {};

            this.$self = false;

            options = elem;
        }

        // Store the options
        this.options = options;
    };

    Inputmask.prototype = {};

    Inputmask.prototype.default = {
        input: null,
        cbox: null,
        type: 'text',
        touchType: 'text',
        label: null,
        wrapper: null,
        labelText: {
            show: 'Show',
            hide: 'Hide'
        },
    };

    // Init function
    Inputmask.prototype.init = function () {
        // Create the modal reference object
        const inputmask = this;
        const input = this.elem;

        // Extend the config options with the defaults
        if (typeof this.options === 'string') {
            inputmask.config = $.extend(true, {}, this.default);
        }
        else {
            inputmask.config = $.extend(true, {}, this.default, this.options);
        }

        let origType = input.getAttribute(ATTR_NAMES.origType) || $(input).closest('.' + CLASSES.inputParent).get(0).getAttribute(ATTR_NAMES.origType) || this.default.type;

        // Avoid setting up the same input twice if this function is called multiple times (e.g. when rendering a form table)
        if (inputs[input.id] || inputs[input.id.replace(/_toggle$/, '')]) {
            console.warn('[Inputmask => _init] already did ' + input.id, inputs[input.id]);
            return false;
        }

        // Check for attribute on the parent container since it can't always be put on the input field in a JSP when using a custom tag
        if (!origType) {
            const inputParent = $(input).closest('.' + CLASSES.inputParent).get(0);

            origType = inputParent.getAttribute(ATTR_NAMES.origType);

            if (!origType) {
                origType = 'text';
            }
        }

        // Setup input
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'true');
        input.classList.add(CLASSES.input);

        inputmask.config.input = input;

        // Get the desired `input[type]` value to use when the field is unmasked
        if (origType) {
            origType = origType.split(',');

            // First value is the default (i.e. non-touch)
            inputmask.config.type = origType[0];

            // If a second value was given, it's for touch
            if (origType.length === 2) {
                inputmask.config.touchType = origType[1];
            }
            else {
                inputmask.config.touchType = inputmask.config.type;
            }
        }

        // Create toggle controls
        inputmask.config = createToggle(inputmask.config);

        // Apply initial settings
        if (inputmask.config.cbox.checked) {
            enableMask(inputmask.config, true);
        }
        else {
            disableMask(inputmask.config, true);
        }

        // Store the settings
        inputs[input.id] = inputmask.config;

        return inputmask;
    };

    // // Public function to hide a mask
    // Inputmask.prototype.hide = function _hideInputmask () {
    //     hideInputmask(this);
    //     // Set focus back to page element where mask was triggered
    //     setFocusOnClose(this);
    // };

    // // Public function to show a mask
    // Inputmask.prototype.show = function _show () {
    //     showInputmask(this);
    // };

    // Set the version number
    Inputmask.version = VERSION;

    // Define jQuery plugin with a source element
    $.fn.inputmask = function (options, elem) {
        return this.each(function () {
            if ( ! $.data(this, NAMESPACE) ) {
                $.data(this, NAMESPACE, new Inputmask(this,options).init());
            }
        });
    };

    // Create from scratch.
    $.inputmask = function (options) {
        return new Modal(options).init();
    };

    return {
        setup: setup,
        teardown: teardown
    };
});
