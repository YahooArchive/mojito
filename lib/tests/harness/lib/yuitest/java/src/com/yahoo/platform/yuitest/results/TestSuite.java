/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.results;

import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;

/**
 *
 * @author Nicholas C. Zakas
 */
public class TestSuite {

    private String name;
    private int duration;
    private int passed;
    private int failed;
    private int ignored;
    private List<TestCase> testCases;
    private List<TestSuite> testSuites;
    private TestSuite parent;

    protected TestSuite(String name, int duration, int passed, int failed, int ignored) {
        this.name = name;
        this.duration = duration;
        this.passed = passed;
        this.failed = failed;
        this.ignored = ignored;
        this.testSuites = new LinkedList<TestSuite>();
        this.testCases = new LinkedList<TestCase>();
    }

    protected void addTestSuite(TestSuite suite){
        testSuites.add(suite);
        suite.setParent(this);
    }

    protected void addTestCase(TestCase testCase){
        testCases.add(testCase);
        testCase.setParent(this);
    }

    public int getDuration() {
        return duration;
    }

    public int getFailed() {
        return failed;
    }

    public String getName() {
        return name;
    }

    public int getPassed() {
        return passed;
    }

    public int getIgnored() {
        return ignored;
    }

    public TestSuite[] getTestSuites(){
        return testSuites.toArray(new TestSuite[testSuites.size()]);
    }

    public TestCase[] getTestCases(){
        return testCases.toArray(new TestCase[testCases.size()]);
    }

    public TestSuite getParent(){
        return parent;
    }

    protected void setParent(TestSuite parent){
        this.parent = parent;
    }

    public int getTotal(){
        return passed + failed;
    }

    public int getTotalIncludingIgnored(){
        return getTotal() + ignored;
    }
    
    public String getPath(){
        return getPath(TestReport.PATH_SEPARATOR);
    }

    public String getPath(String separator){
        String path = "";
        if (parent != null){
            path = parent.getFullPath();
        }
        return path;
    }

    public String getFullPath(){
        return getFullPath(TestReport.PATH_SEPARATOR);
    }

    public String getFullPath(String separator){
        String fullPath = getPath(separator);
        if (fullPath.length() > 0){
            fullPath += separator;
        }
        fullPath += name;
        return fullPath;
    }

    public String[] getFailureMessages(){
        List<String> messages = new LinkedList<String>();

        for (int i=0; i < testSuites.size(); i++){
            messages.addAll(Arrays.asList(testSuites.get(i).getFailureMessages()));
        }

        for (int i=0; i < testCases.size(); i++){
            messages.addAll(Arrays.asList(testCases.get(i).getFailureMessages()));
        }

        return messages.toArray(new String[messages.size()]);
    }

    public boolean hasResults(){
        return getTotal() > 0;
    }

}
