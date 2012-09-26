/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*
 * By convention many node.js applications use an index.js file so we support
 * that convention. In Mojito, index.js is referenced as "main" in package.json
 * which means it stands in for "require('mojito')". Our goal is to redirect
 * the require() to the proper location of the Mojito app/server baseline and to
 * ensure whatever they export is exported to our callers.
 */
module.exports = require('./mojito');
