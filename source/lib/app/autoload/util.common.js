/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


YUI.add('mojito-util', function(Y) {

    var META_AUTOCLOBBER = ['content-type'],
        META_EXCLUDE = ['view'],
        META_ATOMIC = ['content-type'];


    function arrayContainsLowerCase(a, obj) {
        var i = a.length,
            selector = obj.toLowerCase();

        i -= 1;
        while (i >= 0) {
            if (a[i].toLowerCase() === selector) {
                return true;
            }
            i -= 1;
        }
        return false;
    }


    function shouldAutoClobber(k) {
        return arrayContainsLowerCase(META_AUTOCLOBBER, k);
    }


    function isExcluded(k) {
        return arrayContainsLowerCase(META_EXCLUDE, k);
    }


    function isAtomic(k) {
        return arrayContainsLowerCase(META_ATOMIC, k);
    }


    Y.mojito.util = {

        array: {

            remove: function(arr, from, to) {
                var rest = arr.slice((to || from) + 1 || arr.length);

                arr.length = from < 0 ? arr.length + from : from;
                return this.push.apply(arr, rest);
            },

            contains: function(a, obj) {
                var i = a.length;

                i -= 1;
                while (i >= 0) {
                    if (a[i] === obj) {
                        return true;
                    }
                    i -= 1;
                }
                return false;
            }
        },


        copy: function(obj) {
            var temp = null,
                key = '';

            if (!obj || typeof obj !== 'object') { return obj; }
            temp = new obj.constructor();
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    temp[key] = Y.mojito.util.copy(obj[key]);
                }
            }
            return temp;
        },


        heir: function(o) {
            function F() {}
            F.prototype = o;
            return new F();
        },


        /**
         * Recursively merge properties of two objects
         * @method mergeRecursive
         * @param {object} dest The destination object.
         * @param {object} src The source object.
         * @param {boolean} typeMatch Only replace if src and dest types are
         *     the same type if true.
         */
        mergeRecursive: function(dest, src, typeMatch) {
            var p,
                arr;

            if (Y.Lang.isArray(src)) {
                if (!Y.Lang.isArray(dest)) {
                    throw new Error('Type mismatch for object merge.');
                }

                // Not particularly performant, but we need to avoid duplicates
                // as much as possible. Unfortunately, the YUI unique calls
                // don't have an option to work in-place so we have even more
                // overhead here :(.

                // copy destination array.
                arr = dest.slice(0);

                // unroll src elements into our copy via apply.
                arr.push.apply(arr, src);

                // unique the src and destination items.
                arr = Y.Array.unique(arr);

                // truncate destination and unroll uniqued elements into it.
                dest.length = 0;
                dest.push.apply(dest, arr);
            } else {
                for (p in src) {
                    if (src.hasOwnProperty(p)) {
                        // Property in destination object set; update its value.
                        // TODO: lousy test. Constructor matches don't always work.
                        if (src[p] && src[p].constructor === Object) {
                            if (!dest[p]) {
                                dest[p] = {};
                            }
                            dest[p] = this.mergeRecursive(dest[p], src[p]);
                        } else {
                            if (dest[p] && typeMatch) {
                                if (typeof dest[p] === typeof src[p]) {
                                    dest[p] = src[p];
                                }
                            } else if (typeof src[p] !== 'undefined') {
                                // only copy values that are not undefined, null and
                                // falsey values should be copied
                                // for null sources, we only want to copy over
                                // values that are undefined
                                if (src[p] === null) {
                                    if (typeof dest[p] === 'undefined') {
                                        dest[p] = src[p];
                                    }
                                } else {
                                    dest[p] = src[p];
                                }
                            }
                        }
                    }
                }
            }
            return dest;
        },


        /**
         * Used to merge meta objects into each other. Special consideration for
         * certain headers values like 'content-type'.
         * @method metaMerge
         * @private
         * @param {object} to The target object.
         * @param {object} from The source object.
         * @param {boolean} clobber True to overwrite existing properties.
         */
        metaMerge: function(to, from, clobber, __internal) {
            var k,
                tv,
                fv,
                internal = __internal;

            for (k in from) {
                if (from.hasOwnProperty(k)) {
                    if (internal || !isExcluded(k)) {
                        fv = from[k];
                        tv = to[k];
                        if (!tv) {
                            // Y.log('adding ' + k);
                            to[k] = fv;
                        } else if (Y.Lang.isArray(fv)) {
                            // Y.log('from array ' + k);
                            if (!Y.Lang.isArray(tv)) {
                                throw new Error('Meta merge error.' +
                                    ' Type mismatch between mojit metas.');
                            }
                            // Largely used for content-type, but could be other
                            // key values in the future.
                            if (shouldAutoClobber(k)) {
                                if (isAtomic(k)) {
                                    // Note the choice to use the last item of
                                    // the inbound array, not the first.
                                    // Y.log('atomizing ' + k);
                                    to[k] = [fv[fv.length - 1]];
                                } else {
                                    // Not "atomic" but clobbering means we'll
                                    // completely replace any existing array
                                    // value in the slot.
                                    // Y.log('clobbering ' + k);
                                    to[k] = fv;
                                }
                            } else {
                                // A simple push() here would work, but it
                                // doesn't unique the values so it may cause an
                                // array to grow without bounds over time even
                                // when no truly new content is added.
                                Y.mojito.util.mergeRecursive(tv, fv);
                            }
                        } else if (Y.Lang.isObject(fv)) {
                            // Y.log('from object ' + k);
                            if (Y.Lang.isObject(tv)) {
                                // Y.log('merging ' + k);
                                to[k] = Y.mojito.util.metaMerge(tv, fv, clobber,
                                    true);
                            } else if (Y.Lang.isNull(tv) ||
                                    Y.Lang.isUndefined(tv)) {
                                to[k] = fv;
                            } else {
                                throw new Error('Meta merge error.' +
                                    ' Type mismatch between mojit metas.');
                            }
                        } else if (clobber) {
                            // Y.log('clobbering ' + k);
                            to[k] = fv;
                        }
                    }
                }
            }
            return to;
        },


        /*
         * TODO: [Issue 79] I'm sure we can do this better.
         *
         * This function trys to make the given URL relative to the
         * folder the iOS UIWebView is running in.
         */
        iOSUrl: function(url) {

            // If we are not in a DOM, return
            if (typeof window === 'undefined') {
                return url;
            }

            // Now we do some bad stuff for iOS
            // Basically if we are in a UIWebView and its location is a
            // file:// on the device we have to make our URL relative to the
            // file that was opened
            if (window.location.href.indexOf('file://') === 0 &&
                    window.location.href.indexOf('/Applications/') > 0 &&
                    window.location.href.indexOf('.app/') > 0) {
                if (url.charAt(0) === '/') {
                    url = url.slice(1);
                }
            }
            return url;
        }
    };

}, '0.1.0', {requires: [
    'array-extras',
    'mojito'
]});
