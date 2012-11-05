/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.results;

import java.util.Stack;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

/**
 *
 * @author Nicholas C. Zakas
 */
public class TestReportXMLHandler extends DefaultHandler {

    private TestReport report = null;
    private Stack<TestSuite> suites = null;
    private TestCase curTestCase = null;
    private String browser="";

    public TestReportXMLHandler(){
        suites = new Stack<TestSuite>();
    }

    public TestReportXMLHandler(String browser) {
        this();
        this.browser = browser;
    }

    public TestReport getTestReport(){
        return report;
    }

    @Override
    public void endElement(String uri, String localName, String qName) throws SAXException {
        if (qName.equals("testsuite")){
            suites.pop();
        }
    }

    @Override
    public void startElement(String uri, String localName, String qName, Attributes attributes) throws SAXException {
        if (qName.equals("report")){
            report = new TestReport(attributes.getValue("name"),
                    Integer.parseInt(attributes.getValue("duration")),
                    Integer.parseInt(attributes.getValue("passed")),
                    Integer.parseInt(attributes.getValue("failed")),
                    Integer.parseInt(attributes.getValue("ignored")));
            report.setBrowser(browser);
            suites.push(report);
        } else if (qName.equals("testsuite")){
            TestSuite suite = new TestSuite(attributes.getValue("name"),
                    Integer.parseInt(attributes.getValue("duration")),
                    Integer.parseInt(attributes.getValue("passed")),
                    Integer.parseInt(attributes.getValue("failed")),
                    Integer.parseInt(attributes.getValue("ignored")));

            //if there's another suite, add as a child
            suites.peek().addTestSuite(suite);
            suites.push(suite);
        } else if (qName.equals("testcase")){
            TestCase testCase = new TestCase(attributes.getValue("name"),
                    Integer.parseInt(attributes.getValue("duration")),
                    Integer.parseInt(attributes.getValue("passed")),
                    Integer.parseInt(attributes.getValue("failed")),
                    Integer.parseInt(attributes.getValue("ignored")));

            //if there's another suite, add as a child
            suites.peek().addTestCase(testCase);
            curTestCase = testCase;
        } else if (qName.equals("test")){

            //figure out the result
            String xmlResult = attributes.getValue("result");
            int result = Test.PASS;
            if (xmlResult.equals("fail")){
                result = Test.FAIL;
            } else if (xmlResult.equals("ignore")){
                result = Test.IGNORE;
            }

            int duration = 0;
            if (attributes.getValue("duration") != null){
                duration = Integer.parseInt(attributes.getValue("duration"));
            }

            Test test = new Test(attributes.getValue("name"),
                    duration, result, attributes.getValue("message"));

            curTestCase.addTest(test);
        }
    }


}
