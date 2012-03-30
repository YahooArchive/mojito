/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/

var libfs = require('fs'),
    libpath = require('path');


/*
 * Finds a list of files that matches the glob pattern[1].
 *
 * This version only supports the following feature:
 * <ul>
 *  <li>a single star (<code>*</code>) for a whole directory segment
 * </ul>
 *
 * The list doesn't include files that begin with dot (<code>.</code>).
 *
 * [1] http://en.wikipedia.org/wiki/Glob_%28programming%29
 *
 * @module glob
 * @function globSync
 * @param pattern {string} glob pattern
 * @param flags {object} FUTURE
 * @param list {array} list of found matches
 * @return
 * @private
 */
function globSync(pattern, flags, list) {
    var todo = [pattern],
        current,
        done = {},
        parts,
        base,
        subs,
        i,
        sub,
        stat;

    // double-dots not supported
    if (-1 !== pattern.indexOf('**')) {
        return;
    }

    while (todo.length) {
        current = todo.shift();
        if (!done[current]) {
            done[current] = true;

            parts = current.split('*');
            if (parts.length === 1) {
                list.push(current);
            } else {
                base = parts.shift();
                try {
                    subs = libfs.readdirSync(base);
                    for (i = 0; i < subs.length; i += 1) {
                        sub = subs[i];
                        if ('.' !== sub.charAt(0)) {
                            if (parts.length) {
                                try {
                                    stat = libfs.statSync(base + sub);
                                    if (stat.isDirectory()) {
                                        if ((parts.length !== 1) ||
                                                (libpath.existsSync(
                                                    base + sub + parts[0]
                                                ))) {
                                            todo.push(base +
                                                sub + parts.join('*'));
                                        }
                                    } else if (parts[0] === '') {
                                        todo.push(base + sub);
                                    }
                                } catch (ex) {
                                    // no-op.
                                }
                            } else {
                                todo.push(base + sub);
                            }
                        }
                    }
                } catch (e) {
                    // no-op.
                }
            }
        }
    }
}

/*
 * Returns an object with a globSync slot and matcher function reference.
 */
module.exports = {
    globSync: globSync
};
