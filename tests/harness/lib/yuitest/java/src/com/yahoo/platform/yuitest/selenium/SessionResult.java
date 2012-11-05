/*
 * YUI Test Selenium Driver
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.selenium;

import com.yahoo.platform.yuitest.coverage.results.SummaryCoverageReport;
import com.yahoo.platform.yuitest.results.TestReport;

/**
 * Represents the relevant data related to a test run.
 * @author Nicholas C. Zakas
 */
public class SessionResult {

    public static final String XML_FORMAT = "XML";
    public static final String JSON_FORMAT = "JSON";
    public static final String JUNIT_XML_FORMAT = "JUnitXML";
    public static final String TAP_FORMAT = "TAP";
    public static final String GCOV_FORMAT = "GCOV";
    public static final String LCOV_FORMAT = "LCOV";

    private String url;
    private String browser;
//    private String resultsReportText = null;
//    private String coverageReportText = null;
    private String name;
    private String[] messages;
    private TestReport testReport;
    private SummaryCoverageReport coverageReport;

    protected SessionResult(String name, String browser, String url) {
        this.url = url;
        this.browser = browser;
        this.name = name;
    }

    public String getBrowser() {
        return browser;
    }

    public String getName() {
        return name;
    }

    public String getUrl() {
        return url;
    }

    public int getFailed() {
        return testReport.getFailed();
    }

    public int getIgnored() {
        return testReport.getIgnored();
    }

    public String[] getMessages() {
        return messages;
    }

    protected void setMessages(String[] messages) {
        this.messages = messages;
    }

    public int getPassed() {
        return testReport.getPassed();
    }

    public int getTotal(){
        return testReport.getTotal();
    }

    public void setTestReport(TestReport report){
        testReport = report;
    }

    public TestReport getTestReport(){
        return testReport;
    }

    public void setCoverageReport(SummaryCoverageReport report){
        coverageReport = report;
    }

    public SummaryCoverageReport getCoverageReport(){
        return coverageReport;
    }
}
