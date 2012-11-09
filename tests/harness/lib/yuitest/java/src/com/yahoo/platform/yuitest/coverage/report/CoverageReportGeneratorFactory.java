/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.report;

/**
 *
 * @author Nicholas C. Zakas
 */
public class CoverageReportGeneratorFactory {

    public static CoverageReportGenerator getGenerator(String format, String outputDirectory, boolean verbose){
        if (format.equalsIgnoreCase("html")){
            return new HTMLReportGenerator(outputDirectory, verbose);
        } else if (format.equalsIgnoreCase("lcov")){
            return new LCOVReportGenerator(outputDirectory, verbose);
        } else if (format.equalsIgnoreCase("gcov")){
            return new GCOVReportGenerator(outputDirectory, verbose);
        } else {
            throw new IllegalArgumentException("Unsupported format '" + format + "'.");
        }
    }
}
