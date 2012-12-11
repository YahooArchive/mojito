/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


YUI.add('mojito-yaf-client', function(Y, NAME) {

    var MOJITO_NS = Y.namespace('mojito');

    /**
     * The starting point for mojito to run in the browser. You can access one
     * instance of the Mojito Client running within the browser environment
     * through window.YMojito.client.
     * @module MojitoClient
     * @class Client
     * @constructor
     * @namespace Y.mojito
     * @param {Object} config The entire configuration object written by the
     *     server to start up mojito.
     */
    function MojitoYAFClient(config) {

        alert('hi from mojito YAF client: ' + JSON.stringify(config));

    }

    MOJITO_NS.YAFClient = MojitoYAFClient;

    //  ---

    MOJITO_NS.App = Y.Base.create('App', Y.App, [],
        {
            initializer: function (params) {
                var instData,
                    instKeys,
                    i;

                instData = params.instData;
                this.set('mojitData', instData);

                instKeys = Object.keys(instData);

                for (i = 0; i < instKeys.length; i++) {
                    this.registerMojitInstance(instKeys[i]);
                }
            },

            registerMojitInstance: function (instanceName) {
                var mojitTypeName,
                    parts,
                    mojitType,
                    mojitInst;

                if (!(mojitTypeName = this.get('mojitData')[instanceName])) {
                    return;
                }

                parts = mojitTypeName.split('.');

                if (!(mojitType = Y.namespace(parts[0])[parts[1]])) {
                    return;
                }

                //  This will register itself so that the Y.mojito.Mojit type
                //  can find it
                mojitInst = new mojitType({id: instanceName, appInst: this});

                return mojitInst;
            }
        }, {
            ATTRS: {
                mojitData: {value: {}}
            }
        }
    );

    //  ---

    //  This class is a temporary mock up of the upcoming Y.template
    //  functionality.

    MOJITO_NS.Template = Y.Base.create('Template', Y.Base, [],
        {
            _renderer: null,

            init : function (renderer) {

                var templateRenderer;

                //  If no renderer is supplied, then we default to using the
                //  standard Y.Lang.sub() routine.
                if (!(templateRenderer = renderer)) {
                    templateRenderer = {render:
                                         function (template, data) {
                                            return Y.Lang.sub(template, data);
                                            }
                                         };
                }

                this.set('_renderer', templateRenderer);
            },

            render: function (template, data) {
                return this.get('_renderer').render(template, data);
            }
        }
    );

    //  ---

    MOJITO_NS.View = Y.Base.create('View', Y.View, [],
        {
            templateEngine: new MOJITO_NS.Template(),

            initializer: function (params) {
                var model,
                    container,
                    attachPoint;

                if (model = this.get('model')) {
                    model.after('change', this.render, this);
                }

                container = Y.Node.create('<div id="' + params.id +
                                             '" class="mojit"></div>');
                if (attachPoint = this.getDOMAttachPoint()) {
                    attachPoint.append(container);
                }

                container.getDOMNode()._mojit = params.mojit;

                this.set('container', container);
            },

            getChildMojitNodes: function () {
                return this.get('container').all('.mojit').getDOMNodes();
            },

            getDOMAttachPoint: function () {
                return Y.one('body');
            },

            loadTemplate: function () {
                var loc,
                    rootLoc,
                    templateLoc;
               
                templateLoc = this.get('templateLocation');

                if (templateLoc && templateLoc.length > 0) {
                    loc = window.location.href;
                    rootLoc = loc.slice(0, loc.lastIndexOf('/') + 1);

                    this.loadTemplateFrom(rootLoc + templateLoc);
                }
            },

            loadTemplateFrom: function (uri) {
                var cfg,
                    request,
                    templateText;

                cfg = {
                    sync: true
                };

                request = Y.io(uri, cfg);

                templateText = request.responseText;

                if (templateText.length > 0) {
                    this.set('template', templateText);
                }
            },

            render: function () {
                var container,
                    model,
                    html;

                container = this.get('container');

                if (!(template = this.get('template'))) {
                    return;
                }

                if (!(model = this.get('model'))) {
                    html = this.get('templateEngine').render(
                                                    template,
                                                    null);
                } else {
                    html = this.get('templateEngine').render(
                                                    template,
                                                    this.get('model').toJSON());
                }

                container.append(html);
            }
        }, {
            ATTRS: {
                'templateLocation': {value: null},
            }
        }
    );

    //  ---

    MOJITO_NS.Handler = Y.Base.create('Handler', Y.Base, [],
        {
            addView: function (viewObj) {

                //  Tell ourself to set up our event bindings
                //  TODO: This should be per-view - proto code:
                //this.setupEventBindings(viewObj.get('node'));
                this.setupEventBindings();

                //  Register ourself to receive events 'bubbling' from the view
                viewObj.addTarget(this);
            },

            routeToMojit: function (req, res, next) {
                var mojitAction;

                mojitAction = req.params.action;

                //  Fire an event - the mojits should be listening
                this.fire('mojit:' + mojitAction,
                            {params: req.params});

                //  Call the next most-specific handler.
                next();
            },

            setupEventBindings: function () {

                //  The default implementation of this method sets up a
                //  Y.mojito.Handler's "eventBindings"
                var bindings,
                    i,

                    mojitEvent;

                bindings = this.get('eventBindings');

                for (i = 0; i < bindings.length; i++) {

                    //  Capture this outside of the nested function
                    mojitEvent = bindings[i].mojitEvent;

                    Y.one(bindings[i].selector).on(
                            bindings[i].domEvent,
                            function () {
                                this.fire(mojitEvent);
                            }.bind(this));
                }

               return;
            },

            setupRoutes: function (mojitID, appInst) {

                var routes,
                    handlerInst,
                    i,
                    evtName;

                //  Add a generic route for mojit dispatching
                appInst.route('/' + mojitID  + ':*action',
                              this.routeToMojit.bind(this));

                //  Now, get any specifically defined routes, loop over them and
                //  add routing entries
                if (!(routes = this.get('routes'))) {
                    return;
                }

                handlerInst = this;

                for (i = 0; i < routes.length; i++) {
                    evtName = routes[i].event;
                    appInst.route(
                        routes[i].route,
                        function (req, res, next) {
                            handlerInst.fire(evtName, {params: req.params});
                            next();
                        });
                }
            }
        }, {
            ATTRS: {
                eventBindings: {value: []},
                routes: {value: []}
            }
        }
    );

    //  ---

    MOJITO_NS.Mojit = Y.Base.create('Mojit', Y.Base, [],
        {
            initializer : function (params) {

                var id,
                    handlerType,
                    handlerType;

                id = params.id,

                this.set('id', id);

                handlerType = this.get('handlerType');
                handlerInst = new handlerType({mojitID: id});

                handlerInst.addTarget(this);
                handlerInst.setupRoutes(id, params.appInst);

                this.set('handler', handlerInst);
            },

            addViewNamed: function (viewObj, viewName) {
                this.get('views')[viewName] = viewObj;

                //  Maybe could be:
                //  this.get('handler').addEventSource(viewObj,
                //  <bindingsStruct>);

                this.get('handler').addView(viewObj);
            },

            getChildMojits: function () {
                var ourViews,
                    i,

                    childMojitNodes,
                    childMojits;

                //  We might have multiple views which contain mojit references
                ourViews = this.get('views');

                for (i = 0; i < ourViews.length; i++) {
                    childMojitNodes = ourViews[i].getChildMojitNodes();
                    childMojits = childMojitNodes.map(
                                    function (aNode) {
                                        return aNode._mojit;
                                    });
                }
            },

            getViewNamed: function (viewName) {
                return this.get('views')[viewName];
            },

            setupEventObservations: function () {
                var evts = this.get('mojitEvents'),
                    i,

                    evtName,
                    methodName;

                for (i = 0; i < evts.length; i++) {
                    evtName = evts[i];
                    methodName = 'on' + evtName.replace(/(.+):(.+)/,
                            function(whole, prefix, name) {
                                return prefix[0].toUpperCase() +
                                       prefix.slice(1) +
                                       name[0].toUpperCase() +
                                       name.slice(1);
                            });

                    this.on(evtName, this[methodName].bind(this));
                }
            },

        }, {
            ATTRS: {
                id: {value: null},
                models: {value: {}},
                views: {value: {}},
                mojitEvents: {value: null},
                handlerType: {value: MOJITO_NS.Handler}
            }
        }
    );

    MOJITO_NS.Mojit.findAllMojits = function () {
        var allMojitNodes,
            allMojits;

        allMojitNodes = Y.all('.mojit');

        allMojits = {};

        allMojitNodes.each(function (yNode) {
                                var mojit;
                                
                                mojit = yNode.getDOMNode()._mojit;
                                allMojits[mojit.get('id')] = mojit;
                            });

        return allMojits;
    }
}, '0.1.0', {requires: [
    'base',
    'io-base',
    'app',
    'mojito-util'
]});
