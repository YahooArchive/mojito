/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.results;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.json.*;
import static org.junit.Assert.*;

/**
 *
 * @author Nicholas C. Zakas
 */
public class SummaryReportTest {

    public SummaryReportTest() {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    @Test
    public void testSummaryReportLoad() throws IOException, JSONException {
        Reader in = new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage.json"));
        SummaryCoverageReport report = new SummaryCoverageReport(in);

        //make sure the number of file reports is correct
        FileCoverageReport[] fileReports = report.getFileReports();
        String[] filenames = report.getFilenames();
        assertEquals(1, fileReports.length);
        assertEquals("build/cookie.js", filenames[0]);

        //check directory reports
        assertEquals(1, report.getDirectoryReports().length);
        assertEquals("build", report.getDirectoryReports()[0].getDirectory());

        //check file reports on directory reports
        assertEquals(1, report.getDirectoryReports()[0].getFileReports().length);
        assertEquals("build/cookie.js", report.getDirectoryReports()[0].getFileReports()[0].getFilename());

    }

    @Test
    public void testSummaryReportMergeNewData() throws IOException, JSONException {
        Reader in = new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage.json"));
        SummaryCoverageReport report1 = new SummaryCoverageReport(in);

        //another coverage report with a different file
        in = new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage2.json"));
        SummaryCoverageReport report2 = new SummaryCoverageReport(in);

        //merge into the first
        report1.merge(report2);

        //make sure the number of file reports is correct
        FileCoverageReport[] fileReports = report1.getFileReports();
        String[] filenames = report1.getFilenames();
        assertEquals(2, fileReports.length);
        assertEquals("build/cookie.js", filenames[0]);
        assertEquals("build/profiler.js", filenames[1]);
    }

    @Test
    public void testSummaryReportMergeExistingData() throws IOException, JSONException {
        Reader in = new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage.json"));
        SummaryCoverageReport report1 = new SummaryCoverageReport(in);

        //another coverage report with the same file, some different results
        in = new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage3.json"));
        SummaryCoverageReport report2 = new SummaryCoverageReport(in);

        //merge into the first
        report1.merge(report2);

        //make sure the number of file reports is correct
        FileCoverageReport[] fileReports = report1.getFileReports();
        String[] filenames = report1.getFilenames();
        assertEquals(1, fileReports.length);
        assertEquals("build/cookie.js", filenames[0]);
        assertEquals(32, fileReports[0].getFunctionCallCount("setSub:418"));
        assertEquals(31, fileReports[0].getFunctionCallCount("setSubs:457"));
        assertEquals(91, fileReports[0].getLineCallCount(111));
    }

}