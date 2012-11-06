/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.results;

import java.util.Comparator;

/**
 *
 * @author Nicholas C. Zakas
 */
public class FileFunctionComparator implements Comparator<FileFunction> {

    public int compare(FileFunction o1, FileFunction o2) {
       return o1.getName().compareToIgnoreCase(o2.getName());
    }

}
