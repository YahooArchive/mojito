/*
 * YUI Test Selenium Driver
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.config;

import java.util.LinkedList;
import java.util.List;

/**
 * Represents a group of test URLs with common properties.
 * @author Nicholas C. Zakas
 */
public class TestPageGroup {

    private String base = "";
    private int version = 4;
    private List<TestPage> testPages = null;
    private int timeout = 10000;

    //--------------------------------------------------------------------------
    // Constructors
    //--------------------------------------------------------------------------

    /**
     * Creates a new instance using default values for base (empty string),
     * version (2), and timeout (10000).
     */
    public TestPageGroup(){
        this.testPages = new LinkedList<TestPage>();
    }
    
    /**
     * Creates a new instance for the given base. The values for version and
     * timeout are defaulted to 2 and 10000, respectively.
     * @param base The base of the URLs in this group.
     */
    public TestPageGroup(String base){
        this();
        this.base = base;
    }

    /**
     * Creates a new instance for the given base and YUI Test version. The
     * timeout value defaults to 10000.
     * @param base The base of the URLs in this group.
     * @param version The YUI Test version used for URLs in this group.
     */
    public TestPageGroup(String base, int version){
        this();
        this.base = base;
        this.version = version;
    }

    /**
     * Creates a new instance for the given base, YUI Test version, and timeout.
     * @param base The base of the URLs in this group.
     * @param version The YUI Test version used for URLs in this group.
     * @param timeout The default timeout, in milliseconds, for the tests.
     */
    public TestPageGroup(String base, int version, int timeout){
        this();
        this.base = base;
        this.version = version;
        this.timeout = timeout;
    }

    //--------------------------------------------------------------------------
    // Methods
    //--------------------------------------------------------------------------

    /**
     * Adds a TestPage to the group.
     * @param testPage The TestPage to add.
     */
    public void add(TestPage testPage){
        testPages.add(testPage);
        testPage.setOwner(this);
    }

    /**
     * Returns an array of all TestPages in the group.
     * @return An array of all TestPages in the group.
     */
    public TestPage[] getTestPages(){
        TestPage[] result = new TestPage[testPages.size()];
        testPages.toArray(result);
        return result;
    }

    /**
     * Returns the base URL for all tests in the group.
     * @return The base URL for all tests in the group.
     */
    public String getBase(){
        return base;
    }

    /**
     * Returns the YUI Test version for tests in this group.
     * @return The YUI Test version for tests in this group.
     */
    public int getVersion(){
        return version;
    }

    /**
     * Returns the default timeout, in milliseconds, for tests in this group.
     * @return The default timeout, in milliseconds, for tests in this group.
     */
    public int getTimeout(){
        return timeout;
    }

}
