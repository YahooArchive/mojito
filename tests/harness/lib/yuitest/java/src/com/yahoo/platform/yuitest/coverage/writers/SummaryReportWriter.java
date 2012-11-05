/*
 * YUI Test Coverage
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.writers;

import com.yahoo.platform.yuitest.coverage.results.SummaryCoverageReport;
import java.io.IOException;
import java.util.Date;

/**
 *
 * @author Nicholas C. Zakas
 */
public interface SummaryReportWriter {
    public void write(SummaryCoverageReport report) throws IOException;
    public void write(SummaryCoverageReport report, Date date) throws IOException;
    public void close() throws IOException;
}
