/*
YUI 3.5.1-2 (build 22)
Copyright 2012 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
YUI.add('json-stringify-hack', function (Y) {

    "use strict";

    // More info about this hack here:
    // http://yuilibrary.com/projects/yui3/ticket/2532759
    // PR here:
    // https://github.com/yui/yui3/pull/270
    // GIST for verification:
    // https://gist.github.com/4119541
    Y.JSON.stringify = JSON.stringify;

}, '3.5.1-2', {requires: ['json-stringify']});
