/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.results;

import java.io.InputStreamReader;
import java.io.Reader;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author nzakas
 */
public class DirectoryReportTest {

    private DirectoryCoverageReport report;

    public DirectoryReportTest() {
    }

    @BeforeClass
    public static void setUpClass() throws Exception {
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
    }

    @Before
    public void setUp() throws Exception {
        Reader in = new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage.json"));
        SummaryCoverageReport summaryReport = new SummaryCoverageReport(in);
        summaryReport.merge(new SummaryCoverageReport(new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage2.json"))));
        report = summaryReport.getDirectoryReports()[0];
    }

    @After
    public void tearDown() {
    }

    /**
     * Test of getDirectory method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetDirectory() {
        assertEquals("build", report.getDirectory());
    }
    /**
     * Test of getFileReports method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetFileReports() {
        FileCoverageReport[] result = report.getFileReports();
        assertEquals(2, result.length);
        assertEquals("build/cookie.js", result[0].getFilename());
    }

    /**
     * Test of getCoveredLineCount method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCoveredLineCount() throws Exception {
        FileCoverageReport[] fileReports = report.getFileReports();
        assertEquals(fileReports[0].getCoveredLineCount() + fileReports[1].getCoveredLineCount(), report.getCoveredLineCount());
    }

    /**
     * Test of getCalledLineCount method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCalledLineCount() throws Exception {
        FileCoverageReport[] fileReports = report.getFileReports();
        assertEquals(fileReports[0].getCalledLineCount() + fileReports[1].getCalledLineCount(), report.getCalledLineCount());
    }

    /**
     * Test of getCalledLinePercentage method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCalledLinePercentage() throws Exception {
        FileCoverageReport[] fileReports = report.getFileReports();
        assertEquals((double)(fileReports[0].getCalledLinePercentage() + fileReports[1].getCalledLinePercentage())/2, report.getCalledLinePercentage(), 0.2);
    }

    /**
     * Test of getCalledLinePercentageName method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCalledLinePercentageName() throws Exception {
        assertEquals("high", report.getCalledLinePercentageName());
    }

    /**
     * Test of getCoveredFunctionCount method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCoveredFunctionCount() throws Exception {
        FileCoverageReport[] fileReports = report.getFileReports();
        assertEquals(fileReports[0].getCoveredFunctionCount() + fileReports[1].getCoveredFunctionCount(), report.getCoveredFunctionCount());
    }

    /**
     * Test of getCalledFunctionCount method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCalledFunctionCount() throws Exception {
        FileCoverageReport[] fileReports = report.getFileReports();
        assertEquals(fileReports[0].getCalledFunctionCount() + fileReports[1].getCalledFunctionCount(), report.getCalledFunctionCount());
    }

    /**
     * Test of getCalledFunctionPercentage method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCalledFunctionPercentage() throws Exception {
        FileCoverageReport[] fileReports = report.getFileReports();
        assertEquals((double)(fileReports[0].getCalledFunctionPercentage() + fileReports[1].getCalledFunctionPercentage())/2, report.getCalledLinePercentage(), 1.0);
    }

    /**
     * Test of getCalledFunctionPercentageName method, of class DirectoryCoverageReport.
     */
    @Test
    public void testGetCalledFunctionPercentageName() throws Exception {
        assertEquals("med", report.getCalledFunctionPercentageName());
    }

}