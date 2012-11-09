/*
 * YUI Test Selenium Driver
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.config;

/**
 * Represents a single test page and its settings.
 * @author Nicholas C. Zakas
 */
public class TestPage {

    private TestPageGroup owner = null;
    private String path = null;
    private int timeout = 10000;
    private int version = 4;

    //--------------------------------------------------------------------------
    // Constructors
    //--------------------------------------------------------------------------

    /**
     * Creates a new instance based on a path. Timeout and version are defaulted
     * to 10000 and 2, respectively.
     * @param path The path of the test URL.
     */
    public TestPage(String path){
        this.path = path;
    }

    /**
     * Creates a new instance. Timeout is defaulted to 10000.
     * @param path The path of the test URL.
     * @param version The YUI Test version of the test.
     */
    public TestPage(String path, int version){
        this.path = path;
        this.version = version;
    }

    /**
     * Creates a new instance.
     * @param path The path of the test URL.
     * @param version The YUI Test version of the test.
     * @param timeout The timeout for the page.
     */
    public TestPage(String path, int version, int timeout){
        this.path = path;
        this.version = version;
        this.timeout = timeout;
    }

    //--------------------------------------------------------------------------
    // Getters and Setters
    //--------------------------------------------------------------------------

    /**
     * Returns the test path as specified originally.
     * @return The test path as specified originally.
     */
    public String getPath() {
        return path;
    }

    /**
     * Sets the path for the TestPage.
     * @param path The path for the test.
     */
    public void setPath(String path){
        this.path = path;
    }

    /**
     * Sets a TestPageGroup as the owner for this TestPage.
     * @param owner The TestPageGroup that the TestPage should be a part of.
     */
    protected void setOwner(TestPageGroup owner){
        this.owner = owner;
    }

    /**
     * Returns the timeout for the test.
     * @return The timeout for the test.
     */
    public int getTimeout() {
        return timeout;
    }

    /**
     * Returns the YUI Test version for the test.
     * @return The YUI Test version for the test.
     */
    public int getVersion(){
        return version;
    }

    /**
     * Returns the absolute path for the test, prepending the base of its owner
     * TestPageGroup if necessary.
     * @return The absolute path for the test.
     */
    public String getAbsolutePath(){
        if (owner != null){
            return owner.getBase() + path;
        } else {
            return path;
        }
        
    }
}
