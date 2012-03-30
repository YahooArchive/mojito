# Composite Addon

The *composite* add-on provides shortcuts for [executing child mojits](/guides.composites/).

### Requires

Nothing. This plugin is always available.

## API

The *API* described here is available through the first argument in a controller function.

    index: function(ac) {
        ac.composite.run();
    }

### .composite.run(options)

* *options*: [optional] object with any of three posssible configurations:
<!--
   * *params*: may be an *array* or an *object*, operating differently for each type:
      * *[array]*: parameter objects, which will be used when creating new child mojit specifications, one for each param object. Each new mojit will be passed one param object when executed. When this option is specified, the *children* option is ignored if specified. New mojits specs will be based on a child template that must be present in the current composite mojit spec as the `children` value. In this case, the `children` mojit configuration is more of a template for children that will be created, not a predefined spec.
      * *[object]*: the one set of parameters that (if specified) will be sent to each dispatched child.
-->
   * *params*: *[object]*: the one set of parameters that (if specified) will be sent to each dispatched child.
   * *template*: [object] extra values to be passed into the composite mojit template for view rendering
   * *children*: [object] manually created mojit specs for children you'd like to create.
* *return*: undefined

> If neither *children* nor a *params* **[array]** are specified, the _composite plugin_ will attempt to use the `children` spec value of the current mojit for its children spec.

# Examples

## Usage

### Execute all Child Mojits specified in mojit spec

Current Mojit spec:

    "specs": {
        "parent": {
            "type": "MyCompositeMojit",
            "config": {
                "children": {
                    "foo": {
                        "type": "FooMojit"
                    },
                    "bar": {
                        "type": "BarMojit"
                    }
                }
            }
        }
    }

Foo controller:

    YUI.add('test', function(Y) {
    
        function Controller() {}
    
        Controller.prototype = {
    
            index: function(ac) {
    
                ac.composite.run({ 
                    template: { title: 'Hello there' }, // for the view only
                    params: { key: 'val' } // send to each child
                });
                
            }
    
        };
    
        Y.mojito.registerController('test', Controller);
    
    }, '0.0.1', {requires: ['mojito']});

Foo index.html:

    <div id="{{mojit_uuid}}">
    <h1>{{title}}</h1>
    <div class="fooslot">
        {{{foo}}}
    </div>
    <div class="barslot">
        {{{bar}}}
    </div>
    </div>
    
### Execute Manually Specified Child Mojits

Current Mojit spec:

    "specs": {
        "parent": {
            "type": "MyCompositeMojit"
        }
    }

Foo controller:

    YUI.add('test', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(ac) {

                ac.composite.run({ 
                    template: { title: 'Hello there' }, // additional values for view template
                    params: { key: 'val' }, // send to each child
                    children: {
                        "foo": {
                            "type": "FooMojit"
                        },
                        "bar": {
                            "type": "BarMojit"
                        }
                    }
                });

            }

        };

        Y.mojito.registerController('test', Controller);

    }, '0.0.1', {requires: ['mojito']});

Foo index.html:

    <div id="{{mojit_uuid}}">
    <h1>{{title}}</h1>
    <div class="fooslot">
        {{{foo}}}
    </div>
    <div class="barslot">
        {{{bar}}}
    </div>
    </div>

<!--
### Execute Dynamic Child Mojits By Specifying Params Array

Current Mojit spec:

    "specs": {
        "parent": {
            "type": "MyCompositeMojit",
            "config": {
                "children": {
                    "type": "DynamicMojit"
                }
            }
        }
    }

Foo controller:

    YUI.add('test', function(Y) {

        function Controller() {}

        Controller.prototype = {

            index: function(ac) {

                ac.composite.run({ 
                    template: { title: 'Hello there' } ,
                    params: [
                        { keyForChild: 'param value for first child' },
                        { keyForChild: 'param value for second child' },
                        { keyForChild: 'param value for third child' },
                        { keyForChild: 'param value for fourth child' }
                        // ... add as many as you want to be created 
                    ]
                });

            }

        };

        Y.mojito.registerController('test', Controller);

    }, '0.0.1', {requires: ['mojito']});

Foo index.html:

    <div id="{{mojit_uuid}}">
    <h1>{{title}}</h1>
    <ul>
        {{#children}}
            <li>{{{child}}}</li>
        {{/children}}
    </ul>
    </div>

-->
