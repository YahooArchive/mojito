/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/

YUI.add('PagerMojitBinder', function (Y, NAME) {
    var API_KEY = '84921e87fb8f2fc338c3ff9bf51a412e';
    function parseImageId(link) {
        var matches = link.match(/com\/(\d+)\/(\d+)_([0-9a-z]+)\.jpg$/);
        return matches[2];
    }
    function parsePage(link) {
        var matches = link.match(/page=(\d+)/);
        return matches[1];
    }

    /** 
    * The PagerMojitBinder module. 
    * @module PagerMojitBinder 
    */

    /**
    * Constructor for the Binder class.
    *
    * @param mojitProxy {Object} The proxy to allow 
    * the binder to interact with its owning mojit. 
    * @class Binder
    * @constructor     
    */
    Y.namespace('mojito.binders')[NAME] = {
    /**
    * Binder initialization method, invoked 
    * after all binders on the page have 
    * been constructed.    
    */
        init: function(mojitProxy) {
            this.mojitProxy = mojitProxy;
        },
    /**
    * The binder method, invoked to allow the mojit 
    * to attach DOM event handlers.
    * @param node {Node} The DOM node to which this 
    * mojit is attached. 
    */
        bind: function(node) {
            var thatNode = node,
                showOverlay = function(event) {
                    var target = event.target,
                        href = target.get('href'),
                        imageId = parseImageId(href),
                        // Query for the image metadata
                        query = 'select * from flickr.photos.info where photo_id="' + imageId + '" and api_key="' + API_KEY + '"';
                    if (target.hasClass('overlayed')) {
                        target.removeClass('overlayed');
                        thatNode.one('#display').setContent('');
                    } else {
                        target.addClass('overlayed');
                        thatNode.one('#display').setContent('Loading ...');
                        Y.YQL(query, function(raw) {
                            if (!raw.query.results.photo) {
                                Y.log('No results found for photoId: ' + imageId);
                                return;
                            }
                            var props = raw.query.results.photo,
                                snippet = '<ul style="list-style-type: square;">',
                                key;
                            for (key in props) {
                                if (props.hasOwnProperty(key)) {
                                    if (typeof (props[key]) === 'object') {
                                        continue;
                                    }
                                    snippet += '<li>' + key + ': ' + props[key] + '</li>';
                                }
                            }
                            snippet += '</ul>';
                            thatNode.one('#display').setContent(snippet);
                        });
                    }
                },
                // define the action when user click on prev/next         
                flipper = function(event) {
                    var target = event.target,
                    // get the link to the page 
                        page = parsePage(target.get('href')),
                        updateDOM = function(markup) {
                            thatNode.set('innerHTML', markup);
                            thatNode.all('#nav a').on('click', flipper, this);
                            thatNode.all('#master ul li a').on('mouseover', showOverlay, this);
                            thatNode.all('#master ul li a').on('mouseout', showOverlay, this);
                        };
                    this.mojitProxy.invoke('index', { params: {page: page} }, updateDOM);
                };
            // Bind all the image links to showOverlay
            thatNode.all('#master ul li a').on('mouseover', showOverlay, this);
            thatNode.all('#master ul li a').on('mouseout', showOverlay, this);
            // Bind the prev + next links to flipper
            thatNode.all('#nav a').on('click', flipper, this);
        }
    };
}, '0.0.1', {requires: ['yql', 'io', 'dump', 'mojito-client']});
