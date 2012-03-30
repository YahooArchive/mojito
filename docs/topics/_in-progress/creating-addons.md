# Creating ActionContext Addons

In addition to the [ActionContext](/action-context/) addons the Mojito framework provides, you can create your own. 

## Where to put it

Currently, you must put any files you want Mojito to load within a mojit directory. Mojito will load all YUI modules it finds within all mojit directories (except `lib`, which is reserved for NodeJS files).

## How to write it

The ActionContext is a [YUI Base](http://developer.yahoo.com/yui/3/base/) object, and ActionContext addons are [YUI Plugins](http://developer.yahoo.com/yui/3/plugin/).

So, you write a new YUI Plugin and register it with Mojito, like this:

    YUI.add('cheese-ac-plugin', function(Y, NAME) {

        function CheeseAcPlugin() {
            CheeseAcPlugin.superclass.constructor.apply(this, arguments);
        }

        CheeseAcPlugin.NAME = 'cheese'
        CheeseAcPlugin.NS = 'cheese';

        Y.extend(CheeseAcPlugin, Y.Plugin.Base, {

            initializer: function(config) {
                Y.log('Plugging ActionContext', 'debug', NAME);
            },

            /* makes things cheesy */
            cheesify: function(obj) {
                var n;
                if (Y.Lang.isString(obj)) {
                    return 'cheesy ' + obj;
                }
                for (n in obj) {
                    if (obj.hasOwnProperty(n)) {
                        obj[n] = this.cheesify(obj[n]);
                    }
                }
            }
            
        });
        
        Y.mojito.registerAddon('action-context', 'cheese', CheeseAcPlugin);

    }, '0.0.1', {requires: ['plugin', 'mojito']});

Because this plugin is registered as an `action-context` addon with the type `cheese` (see the last line in the module), we can use it within a mojit simply by requiring it.

    YUI.add('Foo', function(Y, NAME) {

        function Controller() {
            Y.log('Controller()', 'debug', NAME);
        }

        Controller.prototype = {

            index: function(ac) {
                var cheesy = ac.cheese.cheesify({
                    food: "nachos",
                    things: "jokes"
                });
            }

        };

        Y.mojito.registerController('Foo', Controller);

    }, '0.0.1', {requires: [
        'mojito',
        'cheese-ac-plugin'
    ]});

## What you can do

You can wrap third party node libraries and YUI libraries. You can also reach up into the ActionContext object and find out what is within it (which is an advanced use-case).

You can call methods on the ActionContext itself, which can be references through `this.get('host')`.
