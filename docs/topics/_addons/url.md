# Url Addon

The *url* add-on allows you to easily generate URL's from params.

### Requires

Nothing. This plugin is always available.

## API

The *API* described here is available through the first argument in a controller function.

    index: function(ac) {
        ac.url.make('@docs', 'index' {key, 'val'}); // optional params
    }

### .url.make(mojitId, mojitAction, params, verb)

* *mojitId*: **string** '@' + mojit id
* *mojitAction*: **string** mojit action
* *params*: [optional] **object** querystring parameters
* *verb*: [optional] **string** HTTP verbe (GET, POST, etc)
* *returns*: **string** URL

### .url.find(url, verb)

*not implemented yet*

# Examples

## Usage

    YUI.add('test', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(ac) {

                var url = ac.url.make('docs', 'index', {query:'mojito', page:2});
            
                ac.done(url);
            }

        };

        Y.mojito.registerController('test', Controller);

    }, '0.0.1', {requires: ['mojito']});
