/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.results;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import org.xml.sax.InputSource;

/**
 *
 * @author Nicholas C. Zakas
 */
public class TestReport extends TestSuite {

    public static final String PATH_SEPARATOR = "\\";

    private String browser = "";

    protected TestReport(String name, int duration, int passed, int failed, int ignored) {
        super(name, duration, passed, failed, ignored);
    }

    protected void setBrowser(String browser){
        this.browser = browser;
    }

    public String getBrowser(){
        return browser;
    }

    @Override
    public String getPath(String separator){
        return "YUITest" + (!browser.equals("") ? separator + browser : "");
    }

    public static TestReport load(File file) throws IOException {
        return load(file, "");
    }

    public static TestReport load(File file, String browser) throws IOException {
        return load(new FileInputStream(file), browser);
    }

    public static TestReport load(InputStream in) throws IOException {
        return load(in, "");
    }

    public static TestReport load(InputStream in, String browser) throws IOException {
        return load(new InputSource(in), browser);
    }

    public static TestReport load(Reader in) throws IOException {
        return load(in, "");
    }

    public static TestReport load(Reader in, String browser) throws IOException {
        return load(new InputSource(in), browser);
    }

    public static TestReport load(InputSource in) throws IOException {
        return load(in, "");
    }

    public static TestReport load(InputSource in, String browser) throws IOException {
        SAXParserFactory spf = SAXParserFactory.newInstance();
        SAXParser parser = null;
        TestReportXMLHandler handler = new TestReportXMLHandler(browser);

        try {
            parser = spf.newSAXParser();
            parser.parse(in, handler);
        } catch (Exception ex) {
            throw new IOException("XML could not be parsed.");
        }

        return handler.getTestReport();

    }

}
