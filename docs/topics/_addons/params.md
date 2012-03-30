# Params Addon

The *params* action context addon allows you to easily access variables from the URL's query string, POST bodies or the Routing systems URL's.

### Requires

Nothing. This plugin is always available.

## API

The *API* described here is available through the first argument in a controller function.

    index: function(ac) {
        ac.params.getFromMerged('name');
    }

### .params.getFromMerged(key)

* *key*: Either a **string** or **null**
* *return*: A **string** or **object** or **array**

### .params.getFromRoute(key)

* *key*: Either a **string** or **null**
* *return*: A **string** or **object** or **array**

### .params.getFromUrl(key)

* *key*: Either a **string** or **null**
* *return*: A **string** or **object** or **array**

### .params.getFromBody(key)

* *key*: Either a **string** or **null**
* *return*: A **string** or **object** or **array**

### .params.getFromFiles()

*Not implemented yet*

# Examples

## Getting a parameter from the requesting URL

    YUI.add('test', function(Y) {
    
        function Controller() {}
    
        Controller.prototype = {
    
            index: function(ac) {
    
                var name = ac.params.getFromMerged('name') || 'Mojito';
                
                ac.done('Hello ' + name);
            }
    
        };
    
        Y.mojito.registerController('test', Controller);
    
    }, '0.0.1', {requires: ['mojito']});
