define(['jquery', 'kind', 'guid', 'journal'], function ($, kind, guid) {
    var CLASSES = {
        messageTypes:{
            warning:'cui-warning',
            success:'cui-success',
            error: 'cui-error',
            informational: 'cui-informational',
            default: 'cui-error'
        },
        pageNotifier: 'cui-field-error-notifier',
        hidden: 'cui-hidden'
    };

    // Private method namespace
    var _priv = {};

    // Private variables namespace
    var _vars = {
        pageMessageLocation: undefined,
        fieldMessageLocation: '.cui-field',
        scrollOffset: 10
    };
    // $('#body-wrapper').find('ul.cui-messages.emp-messages').eq(0);

    var _defaults = {
        pageLocation:{
            wrapper: '#body-wrapper',
            locations: 'ul.cui-messages'
        },
        pageParams: {
            scroll: true,
            scrollElem: undefined
        },
        fieldParams: {
            pageNotifier: true, //Display Field Error page notifier with this message
            scroll: true, // Scroll to top of page when message is displayed
            scrollElem: undefined,
        },
        pageNotifier: {
            message: 'There are one or more errors on this page. Please see below.'
        },
    };

    // array of all messages on the page using the message id as key
    _priv.messageStore = [];


    ////////////////////
    // Public methods //
    ////////////////////

    /**
     * Desc
     *
     * @param   {String}  targetId  ID of the list to toggle
     *
     * @return  {Object}            The updated item list object
     */

    /**
     * Initializes userMessage component. Adds existing messages to messageStore
     */
    var _init = function _init() {
        //Set component variables
        _priv.$pageBody = $('html, body');

        //Scan all message locations and add each message to the data store.
        var messages = $('.cui-messages').find('li');

        if (messages.length > 0) {
            for (var i = 0; i < messages.length; i++) {
                var $message = $(messages[i]);
                var messageId;
                var elementId = $message.attr('id');

                if (elementId) {
                    messageId = elementId;
                }
                else {
                    messageId = guid();
                    $message.attr('id', messageId);
                }

                if (!_priv.messageExistsInStore(messageId, $message.text())) {
                    _priv.messageStore.push({
                        ref:$message,
                        id:messageId
                    });
                }
            }
        }

        // Retrieve default page message location if it exists
        var pageMessageLocation = $('#body-wrapper > .cui-messages');

        // Set page message location if it already exists on the page.
        if (pageMessageLocation.length > 0) {
            _vars.pageMessageLocation = pageMessageLocation[0];
        }
    };

    /**
     * Will render provided messages
     *
     * @param   {Object}  messages Standard messages json object
     */
    var _create = function _create(messages) {
        var i;

        //Check if a valid message object was received.
        if (typeof messages !== 'object') {
            journal.log({type: 'error', owner: 'UI', module: 'userMessages', submodule: '', func: '_create'}, 'Did not receive messages object.', kind(messages));

            return;
        }

        //Process page messages
        if (messages.page) {
            var pageMessages = messages.page;

            for (i = 0; i < pageMessages.length; i++) {
                _priv.createPageMessage(pageMessages[i]);
            }
        }

        //Process field messages
        if (messages.field) {
            var fieldMessages = messages.field;

            for (i = 0; i < fieldMessages.length; i++) {
                _priv.createFieldMessage(fieldMessages[i]);
            }
        }
    };

    /**
     * Will remove the given message from the page.
     *
     * @param   {Standard Message Object}
                {jQuery reference}
                {DOM Node Reference}     message  Reference to message to remove from page
     */
    //.
    var _removeMessage = function _removeMessage(message) {
        var i;
        var $messageParent;

        if (message instanceof jQuery) {

            for (i = 0; i<_priv.messageStore.length;i++) {
                if (_priv.messageStore[i].ref && _priv.messageStore[i].ref.is(message)) {
                    _priv.messageStore.splice(i, 1);
                    break;
                }
            }

            $messageParent = message.parent();

            message.remove();

            if ($messageParent.hasClass('cui-field-message')) {
                if ($messageParent.children().length === 0) {
                    $messageParent.addClass('cui-hidden');
                    $messageParent.removeClass('cui-in-error');
                }
            }

        }
        else if (message instanceof Element) {
            message = $(message);

            for (i = 0; i<_priv.messageStore.length;i++) {
                if (_priv.messageStore[i].ref && _priv.messageStore[i].ref.is(message)) {
                    _priv.messageStore.splice(i, 1);
                    break;
                }
            }

            $messageParent = message.parent();

            message.remove();

            if ($messageParent.hasClass('cui-field-message')) {
                if ($messageParent.children().length === 0) {
                    $messageParent.addClass('cui-hidden');
                    $messageParent.removeClass('cui-in-error');
                }
            }
        }
        else if (typeof message === 'object') {
            //TODO
        }

        _priv.updatePageNotifier();

        //Check if page message location has messages, if not hide message location.
        if(_vars.pageMessageLocation){
            var $pageMessageLoc;
            if (_vars.pageMessageLocation instanceof jQuery) {
                $pageMessageLoc = _vars.pageMessageLocation;
            }
            else{
                $pageMessageLoc = $(_vars.pageMessageLocation);
            }

            if($pageMessageLoc.children().length === 0){
                $pageMessageLoc.addClass(CLASSES.hidden);
            }
        }
    };


    /**
     * Desc
     *
     * @param   {jQuery Object}
     *          {jQuery query}   pageMessageLocation  object to set the page message location to
     */
    // Sets the location used for page messages.
    // Accepts a jQuery object or jQuery query string of location
    //Returns true if message was sucessfully updated.
    var _setPageMessageLocation = function _setPageMessageLocation(pageMessageLocation) {
        if (pageMessageLocation instanceof jQuery) {
            _vars.pageMessageLocation = pageMessageLocation;
            return true;
        }
        else {
            var $location = $(pageMessageLocation);
            if ($location.length > 0) {
                _vars.pageMessageLocation = $location;
                return true;
            }
        }

        return false;
    };

    /**
     * Sets the parent wrapper location for field message list.
     *
     * @param   {String}        fieldMessageLocation  String selector to set as the field message list location.
     */
    var _setFieldMessageLocation = function _setFieldMessageLocation(fieldMessageLocation) {

        if (fieldMessageLocation) {
            _vars.fieldMessageLocation = fieldMessageLocation;
            return true;
        }

        return false;
    };

    /**
     * Sets the page notifier message. Will only update the message if no previous message has been set by the user.
     *
     * @param   {String}        message  Message to be displayed as the field message page notifier.
     */
    var _setPageNotifierMessage = function _setPageNotifierMessage(notifierMessage) {

        if (notifierMessage && typeof notifierMessage === 'string') {

            //Only update the pageNotifier if the message has not already been set.
            if (!_vars.pageNotifierMessage) {
                _vars.pageNotifierMessage = notifierMessage;
            }
        }

        return false;
    };

    /////////////////////
    // Private methods //
    /////////////////////


    _priv.extendPageParameters = function _extendPageParameters (parameters) {
        if (parameters === undefined) {
            parameters = $.extend(true, {}, _defaults.pageParams);
        }
        else {
            parameters = $.extend(true, {}, _defaults.pageParams, parameters);
        }

        return parameters;
    };

    _priv.extendFieldParameters = function _extendFieldParameters (parameters) {
        if (parameters === undefined) {
            parameters = $.extend(true, {}, _defaults.fieldParams);
        }
        else {
            parameters = $.extend(true, {}, _defaults.fieldParams, parameters);
        }

        return parameters;
    };

    _priv.getMessageClassFromType = function _getMessageClassFromType (type) {
        var messageClass;
        switch(type) {
            case 'success':
                messageClass = CLASSES.messageTypes.success;
            break;

            case 'error':
                messageClass = CLASSES.messageTypes.error;
            break;

            case 'warning':
                messageClass = CLASSES.messageTypes.warning;
            break;

            case 'informational':
                messageClass = CLASSES.messageTypes.informational;
            break;

            default:
                messageClass = CLASSES.messageTypes.default;
            break;
        }
        return messageClass;
    };

    _priv.buildPageMessageLocation = function _buildPageMessageLocation() {
        var $locationWrapper = $(_defaults.pageLocation.wrapper).eq(0);
        var $location;

        if ($locationWrapper.length > 0) {
            $locationWrapper = $locationWrapper.eq(0);

            $location = $locationWrapper.find(_defaults.pageLocation.location);

            if ($location.length > 0) {
                _vars.pageMessageLocation = $location.eq(0);
            }
            else {
                $location = $('<ul/>', {
                                'class': 'cui-messages'
                            });

                _vars.pageMessageLocation = $location;
                $locationWrapper.prepend(_vars.pageMessageLocation);
            }
        }
        else {
            journal.log({type: 'error', owner: 'UI', module: 'userMessages', submodule: '', func: '_priv.buildPageMessageLocation'}, 'Invalid default page message location.');
            return;
        }
    };

    _priv.createPageMessage = function _createPageMessage(pageMessage) {
        var parameters = _priv.extendPageParameters(pageMessage.parameters);
        var $message;
        var $messageLocation;
        var messageClass;
        var messageId;

        //If page message is not set, locate it with defaults.
        if (_vars.pageMessageLocation === undefined) {
            _priv.buildPageMessageLocation();
        }

        $messageLocation = $(_vars.pageMessageLocation);

        if (pageMessage.parameters && pageMessage.parameters.id) {
            messageId = pageMessage.parameters.id;

            if (_priv.updateMessage(pageMessage)) {
                return;
            }
        }
        else {
            messageId = guid();
        }

        // Check for an identical existing message (same ID or text)
        if (!_priv.messageExistsInStore(messageId, pageMessage.text)) {
            messageClass = _priv.getMessageClassFromType(pageMessage.type);

            $message = $('<li/>', {
                            'class':messageClass,
                            'html': pageMessage.text,
                            'id': messageId
                        });

            $messageLocation.append($message);

            if ($messageLocation.hasClass('cui-hidden')) {
                $messageLocation.removeClass('cui-hidden');
            }

            //Add new message to messageStore
            _priv.messageStore.push({
                ref:$message,
                msgObj:pageMessage,
                id: messageId,
                type:'page',
                parameters:parameters
            });
        }

        _priv.scrollPage(parameters);
    };

    _priv.createFieldMessage = function _createFieldMessage(fieldMessage) {
        var $field;
        var parameters = _priv.extendFieldParameters(fieldMessage.parameters);

        var _revealField = function _revealField(field, revealFunction) {
            if (revealFunction && typeof revealFunction === 'function') {
              revealFunction(field);
            }
        };

        if (typeof fieldMessage !== 'object') {
            journal.log({type: 'error', owner: 'UI', module: 'userMessages', submodule: '', func: '_priv.createFieldMessage'}, 'Did not receive field message object.', kind(fieldMessage));
            return;
        }

        //Check for valid element.
        if (fieldMessage.elem) {
            if (fieldMessage.elem instanceof jQuery) {
                $field = fieldMessage.elem;
            }
            else {
                $field = $(fieldMessage.elem);
            }

            if ($field === undefined) {
                journal.log({type: 'error', owner: 'UI', module: 'userMessages', submodule: '', func: '_priv.createFieldMessage'}, 'Did not receive valid element for field message or element does not exist on the page');
                return;
            }
        }
        else {
            journal.log({type: 'error', owner: 'UI', module: 'userMessages', submodule: '', func: '_priv.createFieldMessage'}, 'Did not receive valid element for field message');
            return;
        }

        var $fieldParent;
        var $messageLoc;

        //Locate or create.
        if (parameters.messageLocation) {
            $fieldParent = $field.closest(parameters.messageLocation);
        }
        else {
            $fieldParent = $field.closest(_vars.fieldMessageLocation);
        }

        //If there is a valid messages field parent, set the message location
        if($fieldParent.length > 0){

            if ($fieldParent.find('.cui-messages')[0]) {
                $messageLoc = $($fieldParent.find('.cui-messages')[0]);
            }
            else {
                $messageLoc = $('<ul/>', {
                    'class': 'cui-messages cui-field-message'
                });

                $fieldParent.append($messageLoc);
            }
        }
        //If a field parent cannot be found, set the field message location to the page message location.
        else {

            //If page message location is not set, locate it with defaults.
            if (_vars.pageMessageLocation === undefined) {
                _priv.buildPageMessageLocation();
            }

            $messageLoc = $(_vars.pageMessageLocation);
        }

        if (fieldMessage.messages && fieldMessage.messages.length > 0) {
            var messages = fieldMessage.messages;

            for (var i = 0; i < messages.length; i++) {
                var messageId;

                if (!_priv.updateMessage(messages[i])) {
                    //Create new message
                    if (messages[i].parameters && messages[i].parameters.id) {
                        messageId = messages[i].parameters.id;
                    }
                    else {
                        messageId = guid();
                    }

                    // Check for an identical existing message (same ID or text)
                    if (!_priv.messageExistsInStore(messageId, messages[i].text, fieldMessage.elem)) {
                        var messageClass = _priv.getMessageClassFromType(messages[i].type);

                        //Check for existing messages. If message doesn't exist create a new message.
                        var $message = $('<li/>', {
                            'class': messageClass,
                            'html': messages[i].text,
                            'id': messageId
                        });

                        $messageLoc.append($message);
                        //Check for valid message(s)

                        //Add new message to messageStore
                        _priv.messageStore.push({
                            ref: $message,
                            msgObj: messages[i],
                            id: messageId,
                            type: 'field',
                            parameters: parameters,
                            element: fieldMessage.elem
                        });
                    }
                }
            }

            if ($messageLoc.hasClass('cui-hidden')) {
                $messageLoc.removeClass('cui-hidden');
            }

            //If there is a reveal function, call it after processing all messages for the field.
            _revealField($field, parameters.reveal);

            if (parameters.pageNotifier !== false && parameters.pageNotifier !== 'false') {
                _priv.setPageNotifier(parameters);
            }

            if (parameters.scroll === true || parameters.scroll === 'true') {

                if (_vars.pageMessageLocation === undefined) {
                    _priv.buildPageMessageLocation();
                }

                _priv.scrollPage(parameters);
            }
        }
    };

    _priv.updateMessage = function _updateMessage (message) {
        //Check message store if message exists. If it does find the message on the page and update, otherwise return false to continue adding new message.
        var messageId;

        if (message.parameters && message.parameters.id) {
            messageId = message.parameters.id;

            for (var i = 0; i < _priv.messageStore.length; i++) {

                if (_priv.messageStore[i] && _priv.messageStore[i].id === messageId) {
                    var currentMessage = _priv.messageStore[i];
                    var $currentMessage = $('#'+messageId);
                    var newMessageClass = _priv.getMessageClassFromType(message.type);

                    if ($currentMessage.length === 0) {
                        //Message not found in the dom. Remove message from store and return false to recreate.
                        if(i != -1) {
                            _priv.messageStore.splice(i, 1);
                        }
                        return false;
                    }

                    $currentMessage.html(message.text);
                    $currentMessage.attr('class', newMessageClass);

                    return true;
                }
            }
            return false;
        }
        else {
            return false;
        }
    };

    //Adds page notifier if it does not exist, set notifier to visible.
    _priv.setPageNotifier = function _setPageNotifier (/* parameters */) {
        var $messageLocation;

        //If page message location is not set, Load it with defaults.
        if (_vars.pageMessageLocation === undefined) {
            _priv.buildPageMessageLocation();
        }

        $messageLocation = $(_vars.pageMessageLocation);


        var fieldPageNotifierClass = 'cui-field-error-notifier';
        var fieldPageNotifierMessage;

        if (_vars.pageNotifierMessage && _vars.pageNotifierMessage) {
            fieldPageNotifierMessage =  _vars.pageNotifierMessage;
        }
        else {
            fieldPageNotifierMessage = _defaults.pageNotifier.message;
        }


        if ($messageLocation.find('.cui-field-error-notifier').eq(0).length === 0) {
            var $message = $('<li/>', {
                                'class':'cui-error '+ fieldPageNotifierClass,
                                'html': fieldPageNotifierMessage
                            });

            // Append the messages
            $messageLocation.append($message);

            // Display the message section if its marked as hidden
            if ($messageLocation.hasClass('cui-hidden')) {
                $messageLocation.removeClass('cui-hidden');
            }
        }
    };

    //Determines if page notifier should still be displayed, if not removes page notifier
    _priv.updatePageNotifier = function _updatePageNotifier() {
        var $messageLocation;
        var i;

        //If page message location is not set, Load it with defaults.
        if (_vars.pageMessageLocation === undefined) {
            _priv.buildPageMessageLocation();
        }

        $messageLocation = $(_vars.pageMessageLocation);
        var $notifier = $messageLocation.find('.'+CLASSES.pageNotifier).eq(0);

        var displayNotifier = false;

        for (i = 0; i < _priv.messageStore.length; i++) {
            if (_priv.messageStore[i].type && _priv.messageStore[i].type === 'field') {
                if (_priv.messageStore[i].parameters && _priv.messageStore[i].parameters.pageNotifier) {
                    displayNotifier = true;
                }
            }
        }

        if ($notifier.length > 0 && !displayNotifier) {
            $notifier.remove();
            if ($messageLocation.children().length <= 0) {
                $messageLocation.addClass('cui-hidden');
            }
        }
    };

    _priv.scrollPage = function _scrollPage(parameters) {
        if (_priv.$pageBody && !_priv.$pageBody.is(':animated') && (parameters.scroll === true || parameters.scroll === undefined || parameters.scroll === 'true')) {
            var scrollPosition = 0;
            var elemPosition;

            if (parameters.scrollElem) {
                if (parameters.scrollElem instanceof jQuery) {
                    elemPosition = fieldMessage.elem.offset().top;
                }
                else {
                    elemPosition = $(parameters.scrollElem).offset().top;
                }
            }

            if (elemPosition !== undefined) {
                scrollPosition = elemPosition - _vars.scrollOffset;
            }

            _priv.$pageBody.animate({scrollTop: scrollPosition}, 800);
        }
    };

    /**
     * Determines if a message with the given ID or text already exists, i.e. to avoid adding duplicates when re-initializing
     */
    _priv.messageExistsInStore = function _messageExistsInStore (messageId, messageText, messageField) {
        var hasUniqueId = (_priv.messageStore
                                .map(function(m) {
                                    return m.id || m.messageId;
                                })
                                .indexOf(messageId) === -1);

        var hasUniqueText = (_priv.messageStore.map(function(m) {
                                    //If a messageField is provided, only compare message text for messages assigned to the same element.
                                    if(messageField && messageField !== m.element){
                                        return guid();
                                    }
                                    else{
                                        return m.msgObj ? m.msgObj.text : guid();
                                    }
                                }).indexOf(messageText) === -1);

        return (!hasUniqueId || !hasUniqueText);
    };

    /////////////////////
    // Expose publicly //
    /////////////////////

    return {
        init: _init,
        create: _create,
        removeMessage: _removeMessage,

        setPageMessageLocation: _setPageMessageLocation,
        setFieldMessageLocation: _setFieldMessageLocation,

        setPageNotifierMessage: _setPageNotifierMessage,

        messageStore: _priv.messageStore
    };
});
