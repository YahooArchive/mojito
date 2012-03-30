# Server Addon


The *server* add-on allows you to easily set status codes and headers.

### Requires

This plugin is **not** loaded by default. To use it you must add *server-ac-plugin* to the **YUI.add()** requires array.

    YUI.add('test', function(Y) {
        // Controller code
    }, '0.0.1', {requires: ['mojito', 'server-ac-plugin']});

## API

The *API* described here is available through the first argument in a controller function.  Note: It is only available on the server.

    index: function(ac) {
        ac.server.getStatusCode();
    }

### .server.getStatusCode()

* *returns*: **int** HTTP status code

### .server.setStatusCode(code)

* *code*: **int** code to set

### .server.getHeader(key)

* *key*: **string** header value to get
* *returns*: **string** or **array** (*not implemented yet*) header value or undefined if none

### .server.addHeader(key, val)

* *key*: **string** header key to set (setting multiple values for same key is supported)
* *val*: **string** value to set

### .server.getRequest()

* *return*: A **[http.ServerRequest](http://nodejs.org/docs/v0.4.1/api/http.html#http.ServerRequest)**

### .server.getResponse()

* *return*: A **[http.ServerResponse](http://nodejs.org/docs/v0.4.1/api/http.html#http.ServerResponse)**

### .server.isXhr()

* *return*: **boolean** tells you whether the current request is an XMLHttpRequest by checking the 'x-requested-with' header value.

### .server.redirect(mojitId, mojitAction, routeParams, verb, urlParams, code)

> #### NOTE
> This redirect is an _external_ redirect. It causes an HTTP status code 301 by default. For an _internal_ redirect, see the [action context](/action-context/) docs.  

* *mojitId*: **string** id of the mojit to redirect to
* *mojitAction*: **string** mojit action to redirect to
* *routeParams*: **object** used for URL creation for the redirect
* *verb*: **string** 'get', 'post', etc.
* *urlParams*: **object** extra params to attach to the created URL as url parameters
* *code*: **int** HTTP status code, defaults to 301.

# Examples

## Usage

    YUI.add('test', function(Y) {
    
        function Controller() {}
    
        Controller.prototype = {
    
            index: function(ac) {
    
                var code = ac.server.getStatusCode();
                ac.server.setStatusCode(200);
                
                var name = ac.server.getHeader('x-generated-by');
                ac.server.addHeader('x-generated-by', 'Mojito');
                
                ac.done("Title");
            }
    
        };
    
        Y.mojito.registerController('test', Controller);
    
    }, '0.0.1', {requires: ['mojito', 'server-ac-plugin']});

## Redirecting

    save: function(ac) {
        var self = this;
        var root = this.cfg.rootDir;
        var params = ac.params.getFromMerged();
        var model = ac.get('model');
        model.save(root + '/' + params.file, params.content, function(err) {
            var message = err ? 'error saving file: ' + params.file : params.file + ' saved';
            ac.server.redirect('@frame', 'index', {file: params.file}, 'get', {message: message});
        });
    }
