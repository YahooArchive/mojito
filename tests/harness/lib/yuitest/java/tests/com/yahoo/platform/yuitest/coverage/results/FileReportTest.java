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
import org.json.JSONException;
import org.json.JSONObject;
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
public class FileReportTest {

    private FileCoverageReport report;


    public FileReportTest() {
    }

    @BeforeClass
    public static void setUpClass() throws Exception {
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
    }

    @Before
    public void setUp() throws IOException, JSONException {
        Reader in = new InputStreamReader(SummaryReportTest.class.getResourceAsStream("coverage.json"));
        SummaryCoverageReport summaryReport = new SummaryCoverageReport(in);
        report = summaryReport.getFileReport(0);
    }

    @After
    public void tearDown() {
        report = null;
    }

    /**
     * Test of getFilename method, of class FileCoverageReport.
     */
    @Test
    public void testGetFilename() {
        String expResult = "build/cookie.js";
        String result = report.getFilename();
        assertEquals(expResult, result);
    }

    /**
     * Test of getFilename method, of class FileCoverageReport.
     */
    @Test
    public void testGetFileParent() {
        String expResult = "build";
        String result = report.getFileParent();
        assertEquals(expResult, result);
    }

    /**
     * Test of getAbsolutePath method, of class FileCoverageReport.
     */
    @Test
    public void testGetAbsolutePath() {
        String expResult = "C:\\Documents and Settings\\nzakas\\My Documents\\Projects\\yui\\yuitest\\java\\tests\\cookie.js";
        String result = report.getAbsolutePath();
        assertEquals(expResult, result);
    }

    /**
     * Test of getCoveredLineCount method, of class FileCoverageReport.
     */
    @Test
    public void testGetTotalLineCount() throws Exception {
        assertEquals(127, report.getCoveredLineCount());
    }

    /**
     * Test of getCalledLineCount method, of class FileCoverageReport.
     */
    @Test
    public void testGetCalledLineCount() throws Exception {
        assertEquals(109, report.getCalledLineCount());
    }

    /**
     * Test of getCalledLinePercentage method, of class FileCoverageReport.
     */
    @Test
    public void testGetCalledLinePercentage() throws Exception {
        assertEquals(85.83, report.getCalledLinePercentage(), 0.05);
    }

    /**
     * Test of getCoveredFunctionCount method, of class FileCoverageReport.
     */
    @Test
    public void testGetTotalFunctionCount() throws Exception {
        assertEquals(14, report.getCoveredFunctionCount());
    }

    /**
     * Test of getCalledFunctionCount method, of class FileCoverageReport.
     */
    @Test
    public void testGetCalledFunctionCount() throws Exception {
        assertEquals(13, report.getCalledFunctionCount());
    }

    /**
     * Test of getCalledFunctionPercentage method, of class FileCoverageReport.
     */
    @Test
    public void testGetCalledFunctionPercentage() throws Exception {
        assertEquals(92.86, report.getCalledFunctionPercentage(), 0.05);
    }

    /**
     * Test of getLine method, of class FileCoverageReport.
     */
    @Test
    public void testGetUncoveredLine() throws Exception {
        FileLine result = report.getLine(1);
        assertEquals(-1, result.getCallCount());
        assertFalse(result.isCovered());
        assertFalse(result.isCalled());
        assertEquals("/**", result.getText());
        assertEquals(1, result.getLineNumber());
    }

    /**
     * Test of getLine method, of class FileCoverageReport.
     */
    @Test
    public void testGetCoveredandCalledLine() throws Exception {
        FileLine result = report.getLine(6);
        assertEquals(1, result.getCallCount());
        assertTrue(result.isCovered());
        assertTrue(result.isCalled());
        assertEquals("YAHOO.namespace(\"util\");", result.getText());
        assertEquals(6, result.getLineNumber());

    }

    /**
     * Test of getLine method, of class FileCoverageReport.
     */
    @Test
    public void testGetCoveredandNotCalledLine() throws Exception {
        FileLine result = report.getLine(76);
        assertEquals(0, result.getCallCount());
        assertTrue(result.isCovered());
        assertFalse(result.isCalled());
        assertEquals("            throw new TypeError(\"Cookie._createCookieHashString(): Argument must be an object.\");", result.getText());
        assertEquals(76, result.getLineNumber());

    }

    /**
     * Test of getLines method, of class FileCoverageReport.
     */
    @Test
    public void testGetLines() throws Exception {
        FileLine[] result = report.getLines();
        assertEquals(476, result.length);

        FileLine line = report.getLine(1);
        assertEquals(line.getCallCount(), result[0].getCallCount());
        assertEquals(line.isCovered(), result[0].isCovered());
        assertEquals(line.isCalled(), result[0].isCalled());
        assertEquals(line.getText(), result[0].getText());
        assertEquals(line.getLineNumber(), result[0].getLineNumber());
    }

    /**
     * Test of getFunctions method, of class FileCoverageReport.
     */
    @Test
    public void testGetFunctions() throws Exception {
        FileFunction[] result = report.getFunctions();
        assertEquals(14, result.length);

        FileFunction function = result[1];
        assertEquals("_createCookieHashString", function.getName());
        assertEquals(70, function.getLineNumber());
        assertEquals(33, function.getCallCount());
    }


    /**
     * Test of getLineCallCount method, of class FileCoverageReport.
     */
    @Test
    public void testGetLineCallCount() throws Exception {
        assertEquals(-1, report.getLineCallCount(1));
        assertEquals(1, report.getLineCallCount(6));
        assertEquals(2, report.getLineCallCount(371));
    }

    /**
     * Test of getFunctionCallCount method, of class FileCoverageReport.
     */
    @Test
    public void testGetFunctionCallCount() throws Exception {
        int expResult = 72;
        int result = report.getFunctionCallCount("_createCookieString:30");
        assertEquals(expResult, result);
    }

    /**
     * Test of getFunctionNames method, of class FileCoverageReport.
     */
    @Test
    public void testGetFunctionNames() throws Exception {

        String[] result = report.getFunctionNames();
        assertEquals(14, result.length);
        assertEquals("_parseCookieString:123", result[0]);
    }

    /**
     * Test of getReportName method, of class FileCoverageReport.
     */
    @Test
    public void testGetReportName() {
        assertEquals("build_cookie.js", report.getReportName());
    }

    /**
     * Test of merge() method.
     */
    @Test
    public void testMerge() throws JSONException {

        //get clone of JSONObject
        JSONObject clone = new JSONObject(report.toJSONObject().toString());
        clone.put("calledLines", 110);
        clone.getJSONObject("lines").put("207", 1);

        FileCoverageReport newReport = new FileCoverageReport("cookie.js", clone);
        report.merge(newReport);

        assertEquals(110, report.getCalledLineCount());
        assertEquals(1, report.getLineCallCount(207));
        assertEquals(18, report.getLineCallCount(222));
    }

    /**
     * Test of merge() method.
     */
    @Test(expected=IllegalArgumentException.class)
    public void testInvalidMerge() throws JSONException {

        //get clone of JSONObject
        JSONObject clone = new JSONObject(report.toJSONObject().toString());
        clone.put("path", "cookie2.js");
        FileCoverageReport newReport = new FileCoverageReport("cookie2.js", clone);
        report.merge(newReport);
        
    }

}