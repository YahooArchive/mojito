/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.writers;

import java.io.Writer;

/**
 *
 * @author Nicholas C. Zakas
 */
public class HTMLSummaryReportWriter extends StringTemplateSummaryReportWriter {
    public HTMLSummaryReportWriter(Writer out) {
        super(out, "HTML");
    }
}
