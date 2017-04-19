# User Messages

## Overview

The User Messages component creates and manages field and page level messages that occur on the page.

## Usage



## Message Object

The standard message object supports both page and field level messages

```js
{
    "page": [
        {
            "template": "message",
            "type": "success",
            "text": "Sample success message."
        }
    ],
    "field": [
        {
            "elem": "#first-name",
            "parameters": {
                "reveal": revealFunction,
                "pageNotifier": "false",
                "scroll": "true"
            },
            "messages": [
                {
                    "template": "message",
                    "type": "error",
                    "text": "First name is required.",
                    "parameters":{
                        "id": "message id for reference, otherwise one will be created."
                    }
                }
            ]
        }
    ]
}
```

### General Message Parameters
Property | Type | Description
--- | --- | ---
`id` | String | Optional: Id used to reference the message. If the message already exists on the page it will be updated.



### Page
---
```js
"page": [
    {
        "template": "message",
        "type": "success",
        "text": "Sample success message."
        "parameters":{
            "scroll":"true"
        }
    }
]
```
#### Page Message Parameters
Property | Type | Description
--- | --- | ---
`scroll` | Boolean | Optional: Scroll to top of page when the message is displayed. Default: `true`



### Field
---
#### Field Options
```js
"field": [
        {
            "elem": "#first-name",
            "parameters": {
                ...
            },
            "messages": [
                {
                    ...
                }
            ]
        }
    ]
```
Options | Type | Description
--- | --- | ---
`elem` | String/Object/Selector | Required: Reference to the field element
`parameters` | Object | Optional: See Below
`messages` | Object | Required: Standard Messages objece


#### Field Parameters
```js
"parameters": {
    "scroll": "true",
    "suppressPageNotifier": "false",
    "reveal": revealFunction
}
```
Property | Type | Description
--- | --- | ---
`scroll` | Boolean | Optional: Scroll to top of page when the message is displayed. Default: `true`
`pageNotifier` | Boolean | Optional: Show page level notifier with field message. Default: `true`
`reveal` | Function | Optional: Function to call after the message has been added.


## Public Functions

### Init
Initilize the component and add any rendered user messages to the message store.

```js
userMessage.init();
```
Property | Type | Description
--- | --- | ---
`none` |  |


### Create
```js
userMessage.create(messages);
```
Property | Type | Description
--- | --- | ---
`messages` | Object | Standard messages json object. Can contain both field and page messages


### Remove Message
```js
userMessage.removeMessage(message);
```
Property | Type | Description
--- | --- | ---
`message` | Object | DOM or jQuery reference to the message to be removed.


### Set Page Message Location
```js
userMessage.setPageMessageLocation(messageLocation);

```
Accepts a jQuery object or jQuery query string of location.
Default page message location is `$('#body-wrapper > .cui-messages')`

Property | Type | Description
--- | --- | ---
`pageMessageLocation` | Object/Selector | jQuery reference or query string of what element should be set as the message location.


### Set Field Message Location
```js
userMessage.setFieldMessageLocation(fieldMessageLocation);
```
Updates the field message location.
Default field message location is `.cui-field` within the field parent.

Property | Type | Description
--- | --- | ---
`fieldMessageLocation` | Selector | jQuery selector string of what element should be set as the message location.

