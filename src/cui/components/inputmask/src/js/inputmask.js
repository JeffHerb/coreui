define(['jquery'], function ($) {
    /////////////
    // Globals //
    /////////////

    const NAMESPACE = 'inputmask';
    const VERSION = '1.0.0';
    const ATTR_NAMES = {
        origType: 'data-' + NAMESPACE + '-type',
        toggleIdSuffix: '_toggle',
    };


    /////////////
    // Private //
    /////////////

    // Internal flags
    // const isTouch = false;
    const store = {}; // List of tracked configs

    const CLASSES = {
        inputParent: 'cui-inputmask', // e.g. `<div class="cui-field">` which contains the input to be masked
        input: 'cui-' + NAMESPACE + '-input',
        toggleWrapper: 'cui-' + NAMESPACE + '-toggle-wrapper',
    };


    /////////////////////
    // Private methods //
    /////////////////////

    /**
     * Creates a toggler UI
     *
     * @param   {Object}  config  Config object
     *
     * @return  {Object}          Updated Setting with the new UI elements defined
     */
    const createToggle = function createToggle (config) {
        config.wrapper = document.createElement('div');

        // Toggle controls wrapper
        config.wrapper.className = CLASSES.toggleWrapper;

        // Setup checkbox
        config.cbox = document.createElement('input');
        config.cbox.type = 'checkbox';
        config.cbox.id = config.input.id + ATTR_NAMES.toggleIdSuffix;
        config.cbox.checked = true;
        config.cbox.setAttribute('tabindex', '1');
        config.cbox.addEventListener('change', (/*evt*/) => onTogglerChange(config), false);

        // Label
        config.label = document.createElement('label');
        config.label.innerHTML = 'Hide';
        config.label.htmlFor = config.cbox.id;
        config.label.setAttribute('role', 'button');

        // Add label and check box to the wrapper
        config.wrapper.appendChild(config.cbox);
        config.wrapper.appendChild(config.label);

        // Add the wrapper right after the input
        config.wrapper = config.input.parentNode.insertBefore(config.wrapper, config.input.nextSibling);

        // Updated the store
        store[config.input.id] = config;

        return config;
    };

    /**
     * Updates the toggler label text to reflect the current state
     *
     * @param  {String}  config  The new label text
     */
    const setLabelText = function setLabelText (config) {
        var state = config.cbox.checked ? 'show' : 'hide';

        config.label.innerHTML = config.labelText[state];

        return config.labelText[state];
    };

    /**
     * Masks the input's value like a password
     *
     * @param   {Object}  config  Config object
     *
     * @return  {Boolean}         Success/failure
     */
    const enableMask = function enableMask (config) {
        // Change input type to make value unreadable
        config.input.type = 'password';
        config.cbox.checked = true;

        // Update button
        setLabelText(config);

        // Updated the store
        store[config.input.id] = config;

        return config;
    };

    /**
     * Makes the input's value readable
     *
     * @param   {Object}  config  Config object
     *
     * @return  {Boolean}         Success/failure
     */
    const disableMask = function disableMask (config) {
        // Revert input type so the value is readable
        // if (isTouch) {
        //     config.input.type = config.touchType;
        // }
        // else {
            config.input.type = config.type;
            config.cbox.checked = false;
        // }


        // Update button
        setLabelText(config);

        // Updated the store
        store[config.input.id] = config;

        return config;
    };

    /**
     * Toggle a field's masking
     *
     * @param   {Object}  config  Field config
     *
     * @return  {Number}          1 for masking, 2 for unmasking
     */
    const toggleMask = function toggleMask (config) {
        let returnCode = 2;

        // Change from visible -> masked
        if (config.cbox.checked) {
            config = enableMask(config);
            returnCode = 1;
        }
        // Change from masked -> visible
        else {
            config = disableMask(config);
        }

        setFocus(config);

        return returnCode;
    };

    /**
     * Set focus to the input field
     *
     * @param  {Object}  config  Config object
     */
    const setFocus = function setFocus (config) {
        try {
            // This sometimes fails on various browsers for various difficult-to-determine reasons as of 3/24/2015 when this was an iflow component (IE7+ support). Not sure if the try/catch is necessary on modern browsers. (CP 5/8/17)
            config.input.focus();
        }
        catch (e) {
            journal.log({type: 'error', owner: 'UI', module: 'Inputmask', submodule: 'setFocus'}, 'Try/catch was necessary. Exception: ', e);
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

    /**
     * Handles interaction with the toggler
     *
     * @param   {Event}  evt   Click or change event
     */
    const onTogglerChange = function onTogglerChange (config) {
        toggleMask(config);
    };


    ////////////
    // Public //
    ////////////

    const Inputmask = function (elem, options) {
        // Make sure the browser is capable of changing an input's type and that it can query for the more advanced selector needed to find matching input fields
        if (!canSetInputAttribute()) {
            return false;
        }

        if (elem instanceof Node) {
            // Store the element upon which the component was called
            this.elem = elem;

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
            hide: 'Hide',
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

        // Check for attribute on the parent container since it can't always be put on the input field in a JSP when using a custom tag
        if (!origType) {
            origType = 'text';
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

        // Apply initial config
        if (inputmask.config.cbox.checked) {
            inputmask.config = enableMask(inputmask.config, true);
        }
        else {
            inputmask.config = disableMask(inputmask.config, true);
        }

        // Store the config
        store[inputmask.config.input.id] = inputmask.config;

        return inputmask;
    };

    // Public function to hide the value
    Inputmask.prototype.hide = function _hideInputmask () {
        const config = store[this.config.input.id];

        return enableMask(config);
    };

    // Public function to show the value
    Inputmask.prototype.show = function _showInputmask () {
        const config = store[this.config.input.id];

        return disableMask(config);
    };

    // Public function to toggle the display of the value
    Inputmask.prototype.toggle = function _toggleInputmask () {
        const config = store[this.config.input.id];

        // We can't just call `toggleMask()` because for some reason, `config.cbox.checked` is always `true`, unlike the `hide()` and `show()` prototype methods which always get the correct value... (CP 5/8/17)
        $(config.cbox).trigger('click');
    };

    // Set the version number
    Inputmask.version = VERSION;

    // Define jQuery plugin with a source element
    $.fn.inputmask = function (options /*, elem*/) {
        return this.each(function () {
            if (!$.data(this, NAMESPACE)) {
                $.data(this, NAMESPACE, new Inputmask(this, options).init());
            }
        });
    };

    // Create from scratch.
    $.inputmask = function (options) {
        return new Inputmask(options).init();
    };
});
