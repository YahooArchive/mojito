/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint nomen: true, stupid: true */

YUI.add('addon-rs-hotswap', function (Y, NAME) {
    'use strict';
    var fs = require('fs');

    function RSAddonHotswap() {
        RSAddonHotswap.superclass.constructor.apply(this, arguments);
    }
    RSAddonHotswap.NS = 'hotswap';

    Y.extend(RSAddonHotswap, Y.Plugin.Base, {
        initializer: function (config) {
            this._appConfigStatic = config.host.getStaticAppConfig();
            if (this._appConfigStatic.resourceStore && this._appConfigStatic.resourceStore.hotswap) {
                this.config = config;
                // put watchers on the resources once resolved
                this.afterHostMethod('parseResourceVersion', this.parseResourceVersion, this);
                this.afterHostMethod('getStaticAppConfig', this.getStaticAppConfig, this);
                this._cachedTemplates = true;
            }
        },
        parseResourceVersion: function (source, type, subtype, mojitType) {
            var self = this,
                host = self.config.host,
                res = Y.Do.currentRetVal;

            // if the modified resource is a script, reload it from the filesystem
            // in the runtime YUI instance
            if ('.js' === source.fs.ext) {
                fs.watch(source.fs.fullPath, { persistent: false }, function (event) {
                    try {
                        if (fs.readFileSync(source.fs.fullPath, 'utf8')) {
                            // load
                            host.runtimeYUI.applyConfig({ useSync: true });
                            host.runtimeYUI.Get.js(source.fs.fullPath, {});
                            host.runtimeYUI.applyConfig({ useSync: false });

                            // use
                            host.runtimeYUI.Env._attached[res.yui.name] = false;
                            host.runtimeYUI.use(res.yui.name, function () {
                                host.runtimeYUI.log('Reloaded yui module at: ' + source.fs.fullPath, 'info', NAME);
                            });
                        }
                    } catch (e) {
                        host.runtimeYUI.log('Failed to reload module ' + (res.yui && res.yui.name) + ' at ' + source.fs.fullPath + '\n' + e.message, 'error', NAME);
                    }
                });
            } else if (res.type === 'view') {
                // else if it's a view, then dynamically set the app config to no
                // cache for the templates every time the store is asked for the config
                fs.watch(source.fs.fullPath, { persistent: false }, function (event) {
                    self._cachedTemplates = false;
                    Y.log('View templates are not cached anymore', 'info', NAME);
                });
            }
        },
        getStaticAppConfig: function () {
            var ret = Y.Do.currentRetVal;
            // this passes only if a view has been modified
            if (!this._cachedTemplates) {
                ret.viewEngine = ret.viewEngine || {};
                ret.viewEngine.cacheTemplates = false;
            }
            return new Y.Do.AlterReturn(null, ret);
        }
    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.hotswap = RSAddonHotswap;
});

