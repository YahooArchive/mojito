/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.writers;

import com.yahoo.platform.yuitest.coverage.results.FileCoverageReport;
import java.io.IOException;
import java.util.Date;

/**
 *
 * @author Nicholas C. Zakas
 */
public interface FileReportWriter {
    public void write(FileCoverageReport report) throws IOException;
    public void write(FileCoverageReport report, Date date) throws IOException;
    public void close() throws IOException;
}
