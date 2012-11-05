/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.results;

/**
 * Represents a single function in the file.
 * @author Nicholas C. Zakas
 */
public class FileFunction {
    private String name;
    private int lineNumber;
    private int callCount;

    protected FileFunction(String name, int callCount){
        this.lineNumber = Integer.parseInt(name.substring(name.lastIndexOf(":")+1));
        this.name = name.substring(0, name.lastIndexOf(":"));
        this.callCount = callCount;
    }

    public int getCallCount() {
        return callCount;
    }

    protected void setCallCount(int callCount){
        this.callCount = callCount;
    }

    public int getLineNumber() {
        return lineNumber;
    }

    public String getName() {
        return name;
    }

    public boolean isCalled(){
        return callCount > 0;
    }


}
