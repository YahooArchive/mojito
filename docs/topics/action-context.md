# Action Context

The *Action Context* is a key part of the *Mojito* framework.
The *ac*, for short, gives you access to the framework's features from within a controller function.
The ac is an abstraction that allows you to execute mojit actions within either a server or client context.


## API

The *API* described here is available through the first argument in a controller function.

    index: function(ac) {
        ac.done("Hello, world!");
    }

All Action Contexts have some core functions that will always be there, and you'll always use them the same way, no matter whether you're running them on the server or client. Here are those functions.


### .done(data, meta)

* *data*: Either a **string** or **object**.
* *meta*: [optional] An **object** of metadata about the returned data, or a **string** naming the serialization technique.

Either this method or `error()` must be called as the last call for **every** request.

The value of the *data* parameter is what will be sent to the client.
If it is a **string**, it will be sent as is.
If it is an **object** the framework will try to render it using the appropriate view (the view with the same name as the action that was invoked).

The second parameter, *meta*, gives metadata about the data, including instructions to Mojito on how to process the data.
Currently, all the user-supplied information can be better managed using addons.
(For example, the `asset` addon can be used to add assets to the mojit, and the `http` addon can be used to add HTTP response headers.)

The second parameter can also be a string that specifies the serialization technique for the data.
If a serialization technique is used, the view will not.
Here are the following serialization techniques which Mojito understand:

* `json`: Return the data as a JSON string.
* `xml`: Return the data as a simple XML string.  The serialization is very simple:  keys are turned into tags, no attributes are emitted.



### .flush(data, meta)

* *data*: Either a **string** or **object**.  See `.done()`.
* *meta*: [optional] An **object** of metadata about the returned data, or a **string** naming the serialization technique.  See `.done()`.

The same as *.done* except it does not **end** the current request.
It is used to send independent chunks of data back to the client before your final call to *.done*.
Note: if you are using template views you must provided a value for *meta* if you don't want to use the same template on each call to *.flush*.


### .error(err)

* *err*: **object** an Error object giving details of the problem

Either this method or `done()` must be called as the last call for **every** request.

Call this method to signify that your mojit has failed.
When your mojit is run on the server, you can add a `code` member to the Error object to specify the HTTP response code to use.
If none is given, `500` will be used.


### .dispatch(command, adapter, errCb)

The dispatch function is a way you can execute child mojits from within a parent mojit's controller.
This is an advanced use-case -- for managing child mojits it is suggested you use the [composite addon](http://developer.yahoo.com/cocktails/mojito/api/Composite.common.html).



# Addons

The *Action Context* uses a mechanism called *Addons* to provide functionality that lives on the server and/or the client.
Each *Addon* provides additional functionality through a namespaced object which is attached directly to the *ac* argument available in every controller function.

    index: function(ac) {
        ac.params.getFromUrl('query');
    }


## Server & Client Addons

These are available both on the server and client.

* [assets](http://developer.yahoo.com/cocktails/mojito/api/Assets.common.html)
* [composite](http://developer.yahoo.com/cocktails/mojito/api/Composite.common.html)
* [config](http://developer.yahoo.com/cocktails/mojito/api/Config.common.html)
* [cookie-client](http://developer.yahoo.com/cocktails/mojito/api/Cookie.client.html)
* [cookie-server](http://developer.yahoo.com/cocktails/mojito/api/Cookie.server.html)
* [intl](http://developer.yahoo.com/cocktails/mojito/api/Config.common.html)
* [params](http://developer.yahoo.com/cocktails/mojito/api/Params.common.html)
* [partial](http://developer.yahoo.com/cocktails/mojito/api/Partial.common.html)
* [url](http://developer.yahoo.com/cocktails/mojito/api/Url.common.html)


## Server Only Addons

These are *only* available on the server.

* [deploy](http://developer.yahoo.com/cocktails/mojito/api/Deploy.server.html)
* [http](http://developer.yahoo.com/cocktails/mojito/api/Http.server.html)



# Examples


## Simple use of .done() and .flush()

In the example below the string 'Send the first string' is sent via the flush method.
Then after a period of time the string 'Send the second string' is sent via the done() method, which then closes the connection.

    YUI.add('test', function(Y) {

        Y.mojito.controller = {

            index: function(ac) {

                ac.flush('Send the first string');

                setTimeout(function(){
                    ac.done('Send the second string');
                }, 1000);

            }

        };

    });

