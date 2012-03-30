# Mojit Binders

Each mojit you create can have some specific code that is only deployed to the browser with the mojit. This code is there specifically for three reasons:

   1. allow event handler attachment to mojit DOM node
   1. communicate with other mojits on the page
   1. execute actions on the mojit it is attached to

A mojit may have zero, one, or many binders within the `binders` directory. Each binder will be deployed to the browser along with the rest of the mojit code, where the client-side Mojito runtime will call it appropriately. Each action that results in a DOM representation within the client can provide a binder of the same name to bind to that action


## Anatomy of the Binder

A binder essentially has two parts: initializer & binder.

Here is an example of the Binder structure:

    YUI.add('AwesomeMojitBinderIndex', function(Y, NAME) {

        Y.namespace('mojito.binders')[NAME] = {

            init: function(mojitProxy) {
                this.mojitProxy = mojitProxy;
            },

            bind: function(node) {
            }

        };


    }, '0.0.1', {requires: ['node']});

An instance of the binder above will be created whenever the `AwesomeMojit` mojit's `index` action is executed, and it's corresponding DOM node is attached to a client page. Mojito will _select_ that DOM node and pass it into the `bind` function. This allows you to write code to capture UI events and interact with Mojito or other mojit binders.

The _init()_ method is called with an instance of a mojit proxy specific for this mojit binder instance.
It will be called after all other binders on the page have been constructed.
The mojit proxy can be used at this point to listen for or broadcast events.
It is typical to stash the mojit proxy for later use as well.
The mojit proxy is the only gateway back into the Mojito framework for your binder.

The _bind()_ method is passed a *Y.Node* instance that wraps the DOM node representing this mojit instance within the DOM.
This function is where users should attach DOM event handlers to capture user interactions.


### MojitProxy

Each binder, when initialized by Mojito on the client, is given a proxy object for interactions with the mojit it represents as well as with other mojits on the page.
This `mojitProxy` should be stashed within `this` for usage in the other parts of the binder. The mojit proxy provides the following interface:

The MojitProxy API is [here](http://developer.yahoo.com/cocktails/mojito/api/MojitProxy.html).

It contains properties that help provide information to the binder about the mojit that created the DOM it is attached to. You can access the mojit configuration, the type, and the children available here.

In addition, you can broadcast messages to other mojits on the page. See the [broadcast](http://developer.yahoo.com/cocktails/mojito/api/MojitProxy.html#method_broadcast) function for details. Below is an example:

    mojitProxy.broadcast('eventType', {data: 'stuff here'}, { target: { slot: 'child1' });

In the example above, an event called `eventType` along with a data payload is being broadcast only to one child of this particular mojit, which is located in a slot called `child1` of the parent mojit's children configuration.

### mojitProxy.listen(eventType, callback)

The mojit proxy also provides a way to listen for other mojit events.

##### Example

    mojitProxy.listen('eventType', function(evt) {
        var eventType = evt.name;
        var payload = evt.payload;
        var sourceMojit = evt.source;
    });

#### mojitProxy.unlisten(eventType)

This is the opposite of `listen()`.
It causes the binder to stop receiving notices for all of events of the type.
If `eventType` is not given, all events will be forgotten.

#### mojitProxy.invoke(action, options, cb)

The last role a binder might play is that of the source of a Mojit action execution.
For example, a user interaction might necessitate a mojit to refresh its view, so an action must be called on the mojit instance to do this.
The binder goes through the mojit proxy to invoke the action.

This action invocation may take place entirely within the client, or it may make a round trip to the server to be serviced.
By default, a round-trip to the server is made. To override this, specify `runLocal:true` within the invocation options.

The `params` specified will be available within the target action just like GET parameters, and the callback will be called with the result of the operation in the same way whether it was run on the server or client.

##### Example

    mojitProxy.invoke('actionName',
        {
            params: {
                url: {foo: 1, bar: 2}
            }
        },
        function(err,data,meta) {
            // do something with the result here
        });

#### mojitProxy.render()

This method renders the "data" provided into the "view" specified.
The "view" must be the name of one of the files in the current Mojits "views" folder.
Returns via the callback.

## Typical Binder Example:

    YUI.add('ChickenMojitBinder', function(Y, NAME) {

        Y.namespace('mojito.binders')[NAME] = {

            init: function(mojitProxy) {
                Y.log('Binder(' + mojitProxy.config.id + ')', 'debug', NAME);
                var self = this;
                this.mojitProxy = mojitProxy;   // stash for later use
                this.id = mojitProxy.config.id; // stash for later use

                // listen for cluck events from other chickens
                this.mojitProxy.listen('cluck', function(evt) {
                    Y.log(this.id + ' heard cluck from ' + evt.source.id);
                    if (self.node) {
                        self.node.append('<p>' + self.id + ' heard cluck from ' + evt.source.id + '</p>');
                    }
                });
            },

            bind: function(node) {
                Y.log('bind(' + this.id + ')', 'debug', NAME);
                this.node = node;
                node.on('click', function() {
                    Y.log(this.id + ' clicked', 'debug', NAME);
                    this.mojitProxy.broadcast('cluck');
                }, this);
            }

        }

    }, '0.0.1', {requires: ['node']});



