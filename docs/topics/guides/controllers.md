# Controllers

## _**init**_

If you provide an `init` function on your controller, Mojito will call it as it creates a controller instance, passing in the mojit specification. You can stash this on `this` for use within controller actions.

## Actions

Any function you attach to `Y.mojito.controller` is available as an _action_ for Mojito. These acitons should accept one argument, the [ActionContext](/action-context/).

## _**this**_

Within your controller actions and the `init` action, the `this` reference points to an instance of the controller the action is running within. This means that you can refer to other functions or actions described within `Y.mojito.controller` using `this.otherFunction`. This is helpful when you've added some utility functions onto your controlelr that do not accept an `ActionContext` as the argument, but you wish to use between several actions.

## State

You can store state within controllers when they are running within the client, because the client-side Mojito runtime is long-lived.

>NOTE: You cannot store state within server controllers. The Mojito server runtime is _stateless_.

For example, you might have the following actions:

    YUI.add('Stateful', function(Y, NAME) {

        Y.mojito.controller = {
    
            init: function(spec) {
                this.spec = spec;
                this.time = new Date().getTime();
            },

            index: function(ac) {
                ac.done({id: this.spec.id});
            },

            pitch: function(ac) {
                this.logit('pitch');
                this.ball = ac.params.getFromMerged('ball');
                ac.done();
            },

            'catch': function(ac) {
                var self = this;
                this.logit('catch');
                ac.models.Stateful.getData(function(err, data) {
                    ac.done({
                        ball: self.ball,
                        time: self.time,
                        model: data.modelId
                    }, 'json');
                });
            },


            logit: function(msg) {
                Y.log(msg + this.time, 'warn', NAME);
            }

        };

    }, '0.0.1', {requires: []});

The `pitch` action stashes a variable on `this` called _ball_. If a binder on the client invokes this action, the _ball_parameter it sends will be stored in controller instance state. If the binder then invokes the `catch` action, that state variable is retrieved and sent back into the binder's callback.
