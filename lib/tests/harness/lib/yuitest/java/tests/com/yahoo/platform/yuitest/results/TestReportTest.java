/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.results;

import java.io.File;
import java.io.InputStreamReader;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import org.xml.sax.InputSource;

/**
 *
 * @author nzakas
 */
public class TestReportTest {

    public TestReportTest() {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    private void checkReport(TestReport report){

        TestSuite firstSuite = report.getTestSuites()[0];

        TestCase firstTestCase = firstSuite.getTestCases()[0];
        TestCase secondTestCase = firstSuite.getTestCases()[1];

        //duration="729" passed="48" failed="0" ignored="0" total="48
        assertEquals("All Mock Tests", report.getName());
        assertEquals(729, report.getDuration());
        assertEquals(48, report.getPassed());
        assertEquals(0, report.getFailed());
        assertEquals(0, report.getIgnored());

        assertEquals(1, report.getTestSuites().length);
        assertEquals(3, firstSuite.getTestCases().length);

        assertEquals(40, secondTestCase.getTests().length);

        assertEquals("Arguments Tests", secondTestCase.getName());
        assertEquals("Passing correct number of arguments should make the test pass", secondTestCase.getTests()[0].getName());
    }

    /**
     * Test of load method, of class TestReport.
     */
    @Test
    public void testLoad_InputStream() throws Exception {
        TestReport report = TestReport.load(TestReportTest.class.getResourceAsStream("results.xml"));
        checkReport(report);
    }

    /**
     * Test of load method, of class TestReport.
     */
    @Test
    public void testLoad_Reader() throws Exception {
        TestReport report = TestReport.load(new InputStreamReader(TestReportTest.class.getResourceAsStream("results.xml")));
        checkReport(report);

    }

    /**
     * Test of load method, of class TestReport.
     */
    @Test
    public void testLoad_InputSource() throws Exception {
        TestReport report = TestReport.load(new InputSource(TestReportTest.class.getResource("results.xml").getFile()));
        checkReport(report);

    }

    /**
     * Test of load method, of class TestReport.
     */
    @Test
    public void testLoad_InputSourceWithBrowser() throws Exception {
        TestReport report = TestReport.load(new InputSource(TestReportTest.class.getResource("results.xml").getFile()), "Firefox");
        assertEquals("Firefox", report.getBrowser());
    }

    @Test
    public void testGetPath() throws Exception {
        TestReport report = new TestReport("testreport1", 100, 2, 3, 4);
        report.setBrowser("firefox");
        assertEquals("YUITest\\firefox", report.getPath());
        assertEquals("YUITest\\firefox\\testreport1", report.getFullPath());
    }

}