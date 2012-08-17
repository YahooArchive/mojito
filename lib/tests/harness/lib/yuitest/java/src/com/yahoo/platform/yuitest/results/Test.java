/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.results;

/**
 * Represents a single test result.
 * @author Nicholas C. Zakas
 */
public class Test {

    public static final int PASS = 0;
    public static final int FAIL = 1;
    public static final int IGNORE = 2;

    private String name;
    private int result;
    private String message;
    private String stackTrace;
    private int duration;
    private TestCase parent;

    protected Test(String name, int duration, int result, String message) {
        this.name = name;
        this.result = result;
        this.message = message;
        this.duration = duration;
    }

    public String getMessage() {
        return message;
    }

    public String getName() {
        return name;
    }

    public int getResult() {
        return result;
    }

    public String getResultText(){
        switch(result){
            case PASS: return "pass";
            case FAIL: return "fail";
            default: return "ignore";
        }
    }

    public String getStackTrace() {
        return stackTrace;
    }

    public int getDuration(){
        return duration;
    }

    protected void setStackTrace(String stackTrace){
        this.stackTrace = stackTrace;
    }

    public TestCase getParent(){
        return parent;
    }

    protected void setParent(TestCase parent){
        this.parent = parent;
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

    public boolean isFailed(){
        return result == FAIL;
    }

    public boolean isIgnored(){
        return result == IGNORE;
    }

    public boolean isPassed(){
        return result == PASS;
    }
}
