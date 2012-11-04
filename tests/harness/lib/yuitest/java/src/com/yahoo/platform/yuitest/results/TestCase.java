/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.results;

import java.util.LinkedList;
import java.util.List;

/**
 *
 * @author Nicholas C. Zakas
 */
public class TestCase {

    private String name;
    private int duration;
    private List<Test> tests;
    private int passed = 0;
    private int failed = 0;
    private int ignored = 0;
    private TestSuite parent;

    protected TestCase(String name, int duration, int passed, int failed, int ignored){
        this.name = name;
        this.duration = duration;
        this.passed = passed;
        this.failed = failed;
        this.ignored = ignored;
        this.tests = new LinkedList<Test>();
    }

    protected void addTest(Test test){
        tests.add(test);
        test.setParent(this);
    }

    public int getDuration() {
        return duration;
    }

    public int getFailed() {
        return failed;
    }

    public int getIgnored() {
        return ignored;
    }

    public String getName() {
        return name;
    }

    public int getPassed() {
        return passed;
    }
            
    public Test[] getTests(){
        return tests.toArray(new Test[tests.size()]);
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
        for (int i=0; i < tests.size(); i++){
            if (tests.get(i).getResult() == Test.FAIL){
                messages.add(String.format("%s: %s", tests.get(i).getName(),
                        tests.get(i).getMessage()));
            }
        }
        return messages.toArray(new String[messages.size()]);
    }

    public boolean hasResults(){
        return getTotal() > 0;
    }

}
