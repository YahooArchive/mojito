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

        var app = new Y.App();
        new Y.mojito.Builder({configData: config, appObj: app});
    }

    MOJITO_NS.YAFClient = MojitoYAFClient;

    //  ---

    MOJITO_NS.Builder = Y.Base.create('Builder', Y.Base, [],
        {
            initializer: function (params) {
                var configData,
                    appObj,
                    binderMap,
                    viewIDs,
                    i,

                    newController;

                configData = params.configData;
                this.set('configData', configData);

                appObj = params.appObj;

                //  First, need to see if there is a 'binderMap' (as they were
                //  called in the old Mojito client).
                if (!(binderMap = configData.binderMap)) {
                    return new Error('Couldn\'t find binder map');
                }

                //  Now, the keys in the binder map are keyed by their 'view
                //  ID'. This is a unique key.
                viewIDs = Object.keys(binderMap);

                //  Register a controller instance for each viewID key.
                for (i = 0; i < viewIDs.length; i++) {

                    newController = this.registerControllerInstance(
                                                    viewIDs[i],
                                                    binderMap[viewIDs[i]],
                                                    configData,
                                                    appObj);

                    if (newController) {
                        this.setupRoutesFor(newController, configData, appObj);
                    }
                }
            },

            registerControllerInstance: function (viewID, configEntry, configData, appObj) {
                var controllerClassName,
                    parts,

                    name,

                    controllerNS,
                    controllerCN,

                    controllerClass,
                    controllerInst;

                //  Had an entry, but no type name for it
                if (!(controllerClassName = configEntry.type)) {
                    return new Error('Couldn\'t find type name in: ' +
                                     JSON.stringify(configEntry));
                }

                parts = controllerClassName.split('.');

                if (parts.length == 1) {
                    controllerNS = 'mojito';
                    controllerCN = parts[0];
                } else if (parts.length == 2) {
                    controllerNS = parts[0];
                    controllerCN = parts[1];
                }

                //  Tack the word 'Controller' onto the end of the class name
                controllerCN += 'Controller';

                //  Try to get a real Class object
                if (!(controllerClass =
                            Y.namespace(controllerNS)[controllerCN])) {
                    return;
                }

                //  This will register itself so that the Y.mojito.Controller
                //  type can find it. Note here how we pass along the
                //  configEntry so that the new instance can configure itself
                //  in any specialized way that it needs.
                controllerInst = new controllerClass(
                    {id: viewID, configEntry: configEntry,
                        configData: configData, appObj: appObj});

                return controllerInst;
            },

            fireEventOnRoute: function (req, res, next) {
                var controllerAction;

                controllerAction = req.params.action;

                //  Fire an event - the controller should be listening
                this.fire('mojit:' + controllerAction, {params: req.params});

                //  Call the next most-specific handler.
                next();
            },

            setupRoutesFor: function (controller, configData, appObj) {

                var routes,
                    name,

                    routeKeys,
                    i,
                    routePath,
                    routeCall,

                    builderInst,
                    evtName;

                //  Add the controller as a target of our dispatches
                this.addTarget(controller);

                //  First, get any routes that are defined on the controller.
                //  This very well may be an empty Array
                routes = controller.get('routes');

                //  If the controller has a name
                if (name = controller.get('name')) {

                    //  Add a generic route for mojit dispatching
                    appObj.route('/' + name + ':*action',
                                  this.fireEventOnRoute.bind(this));

                    //  See if the configData has any additional routes for
                    //  this controller. This will be found under the 'routes'
                    //  entry in the configData, keyed by the controller name
                    routeKeys = Object.keys(configData.routes);
                    for (i = 0; i < routeKeys.length; i++) {
                        if (routeKeys[i] == name) {
                            routePath = configData.routes[routeKeys[i]].path;
                            routeCall = configData.routes[routeKeys[i]].call;

                            //  We use the routePath as is, but we transform
                            //  the routeCall into an event by replacing the
                            //  dot ('.') with a colon (':')
                            routeCall = routeCall.replace('.', ':');

                            //  Now, add it to the routes
                            routes.push({route: routePath, event: routeCall});
                        }
                    }
                }

                //  Loop over the routes and add routing entries
                builderInst = this;

                for (i = 0; i < routes.length; i++) {
                    evtName = routes[i].event;
                    appObj.route(
                        routes[i].route,
                        function (req, res, next) {
                            builderInst.fire(evtName, {params: req.params});
                            next();
                        });
                }
            }
        }, {
            ATTRS: {
                configData: {value: {}}
            }
        }
    );

    //  ---

    MOJITO_NS.Controller = Y.Base.create('Controller', Y.Base, [],
        {
            initializer : function (params) {

                var id,
                    name,
                    handlerType,
                    handlerType;

                id = params.id,

                this.set('id', id);

                if (!(name = this.get('name'))) {
                    name = this.getNameForViewID(id, params.configData);
                    this.set('name', name);
                }

                handlerType = this.get('handlerType');
                handlerInst = new handlerType({mojitID: id});

                handlerInst.addTarget(this);

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

            getNameForViewID: function (viewID, configData) {
                var binderMap,
                    viewIDs,
                    i,

                    children,
                    childKeys,
                    j;

                //  First, need to see if there is a 'binderMap' (as they were
                //  called in the old Mojito client).
                if (!(binderMap = configData.binderMap)) {
                    return new Error('Couldn\'t find binder map');
                }

                //  Iterate over all of the entries in the binderMap, looking
                //  for a child in the 'children' structure that has a viewID
                //  matching the supplied viewID. That child's name will the
                //  name we want.
                viewIDs = Object.keys(binderMap);
                for (i = 0; i < viewIDs.length; i++) {
                    //  If there are no 'children' for this entry, move along
                    if (!(children = binderMap[viewIDs[i]].children)) {
                        continue;
                    }

                    childKeys = Object.keys(children);
                    for (j = 0; j < childKeys.length; j++) {
                        childEntry = children[childKeys[j]];
                        if (childEntry.viewId == viewID) {
                            return childKeys[j];
                        }
                    }
                }

                return '';
            },

            getViewNamed: function (viewName) {
                return this.get('views')[viewName];
            },

            setupEventObservations: function () {
                var evts = this.get('controllerEvents'),
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

                    if (!(this[methodName])) {
                        return new Error('Couldn\'t find method named: ' +
                                             methodName + ' for: ' +
                                             this.constructor.NAME);
                    }

                    this.on(evtName, this[methodName].bind(this));
                }
            },

        }, {
            ATTRS: {
                id: {value: null},
                name: {value: null},
                models: {value: {}},
                views: {value: {}},
                controllerEvents: {value: null},
                routes: {value: []},
                handlerType: {value: MOJITO_NS.Handler}
            }
        }
    );

    MOJITO_NS.Controller.findAllControllers = function () {
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

            setupEventBindings: function () {

                //  The default implementation of this method sets up a
                //  Y.mojito.Handler's "eventBindings"
                var bindings,
                    i,

                    controllerEvent;

                bindings = this.get('eventBindings');

                for (i = 0; i < bindings.length; i++) {

                    //  Capture this outside of the nested function
                    controllerEvent = bindings[i].controllerEvent;

                    Y.one(bindings[i].selector).on(
                            bindings[i].domEvent,
                            function () {
                                this.fire(controllerEvent);
                            }.bind(this));
                }

               return;
            }
        }, {
            ATTRS: {
                eventBindings: {value: []}
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

                if (!(container = Y.one('#' + params.id))) {
                    container = Y.Node.create('<div id="' + params.id +
                                                 '" class="mojit"></div>');
                    if (attachPoint = this.getDOMAttachPoint()) {
                        attachPoint.append(container);
                    }
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
                    if (Object.keys(model.changed).length > 0) {
                        html = this.get('templateEngine').render(
                                                template,
                                                this.get('model').toJSON());
                    }
                }

                container.setHTML(html);
            }
        }, {
            ATTRS: {
                'templateLocation': {value: null},
            }
        }
    );


}, '0.1.0', {requires: [
    'base',
    'io-base',
    'app',
    'mojito-util'
]});
