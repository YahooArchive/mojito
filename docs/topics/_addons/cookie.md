# Cookie Addon

The *cookie* add-on allows you to easily use cookies.


### Requires

Nothing. This plugin is always available.

## API

The *API* described here is available through the first argument in a controller function.

    index: function(ac) {
        ac.cookie.get('mojito');
    }

### .cookie.getCookie(key)

* *key*: A **string**
* *return*: A **string**

### .cookie.setCookie(key, val)

* *key*: A **string**
* *val*: A **string**
* *return*: undefined

_Multiple values for the same cookie may be set._

# Examples

## Getting a single value from a cookie

    YUI.add('test', function(Y) {
    
        function Controller() {}
    
        Controller.prototype = {
    
            index: function(ac) {
    
                var cookie = ac.cookie.getCookie('mojito');
                
                ac.done('Hello, world!');
            }
    
        };
    
        Y.mojito.registerController('test', Controller);
    
    }, '0.0.1', {requires: ['mojito']});
