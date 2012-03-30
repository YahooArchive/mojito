# REST Library

Mojito ships with a library to make it easier to make a webservice call in your model.


## Installing

This library comes with Mojito, but you still need to tell YUI to make it available to your model.
You can do this by adding `mojito-lib-rest` to the `requires` part of your model.
Once you've done that you can access it at `Y.mojito.lib.REST`.

    YUI.add('MyModel', function(Y) {
        ...
        Y.mojito.lib.REST.GET(...);
        ...
    }, '0.0.1', {requires: ['mojito', 'mojito-lib-rest']});


## Example

    YUI.add('ProductSearchModel', function(Y) {

        function Model() {}

        Model.prototype = {

            productSearch: function(count, cb) {
                var url = 'http://api.shopping.yahoo.com/ShoppingService/V1/productSearch';
                var params = {
                    count: count
                };
                var config = {
                    timeout: 5000,
                    headers: {
                        'Cache-Control': 'max-age=0'
                    }
                };
                Y.mojito.lib.REST.GET(url, params, config, function(err, response) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, response.getBody());
                });
            }

        };

        Y.mojito.registerModel('ProductSearch', Model);

    }, '0.0.1', {requires: ['mojito', 'mojito-lib-rest']});


## API Reference

### REST
The `Y.mojito.lib.REST` object has the following methods.


#### GET(url, params, config, callback)
This performs an HTTP GET call, and calls the callback once done.

* *url*: **string** URL to request
* *params*: **object** set of keys & values to add as query paramters
* *config*: **object** see "Configuration Object" below
* *callback*: **function**: see "Callback" below

This function does not return.  The results are sent to the callback.


#### POST(url, params, config, callback)
This performs an HTTP POST call, and calls the callback once done.

* *url*: **string** URL to request
* *params*: **object** set of keys & values to add as form-encoded variables to the body
* *config*: **object** see "Configuration Object" below
* *callback*: **function**: see "Callback" below

This function does not return.  The results are sent to the callback.


#### PUT(url, params, config, callback)
This performs an HTTP PUT call, and calls the callback once done.

* *url*: **string** URL to request
* *params*: **object** set of keys & values to add as query paramters
* *config*: **object** see "Configuration Object" below
* *callback*: **function**: see "Callback" below

This function does not return.  The results are sent to the callback.


#### DELETE(url, params, config, callback)
This performs an HTTP DELETE call, and calls the callback once done.

* *url*: **string** URL to request
* *params*: **object** set of keys & values to add as query paramters
* *config*: **object** see "Configuration Object" below
* *callback*: **function**: see "Callback" below

This function does not return.  The results are sent to the callback.


#### HEAD(url, params, config, callback)
This performs an HTTP HEAD call, and calls the callback once done.

* *url*: **string** URL to request
* *params*: **object** set of keys & values to add as query paramters
* *config*: **object** see "Configuration Object" below
* *callback*: **function**: see "Callback" below

This function does not return.  The results are sent to the callback.



#### Configuration Object
The config object can contain the following entries:

* *timeout*: **integer** number of milliseconds before the request times out
* *headers*: **object** a set of headers to include in the request
<!-- * *proxy*: **string** an HTTP proxy to use for the request -->

This library will automatically add the `Host` and `Port` headers as per the HTTP/1.1 specification.


#### Callback
The callback has the following signature:  `callback(error, response)`.

* *error*: **object** an Error object describing the problem. Will be null if no error occurred.
* *response*:  **object** see "Response Object" below


### Response Object

The response object contains the results of the HTTP call.
It has the following methods.


#### `getStatusCode()`

* *return*: **integer** HTTP status code

#### `getStatusMessage()`

* *return*: **string** message part of the HTTP status line

#### `getHeader(name)`

* *name*: **string** name of header to return
* *return*: **string** header from response

#### `getHeaders()`

* *return*: **object** all headers from the response

#### `getBody()`

* *return*: **string** body of the response



