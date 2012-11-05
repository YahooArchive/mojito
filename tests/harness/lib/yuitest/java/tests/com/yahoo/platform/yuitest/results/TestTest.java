/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */
package com.yahoo.platform.yuitest.results;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author nzakas
 */
public class TestTest {

    private com.yahoo.platform.yuitest.results.Test instance;

    public TestTest() {
    }

    @Before
    public void setUp() {
        instance = new com.yahoo.platform.yuitest.results.Test("test1", 50, com.yahoo.platform.yuitest.results.Test.PASS, "Test passed.");
    }

    @After
    public void tearDown() {
        instance = null;
    }

    /**
     * Test of getMessage method, of class Test.
     */
    @Test
    public void testGetMessage() {
        assertEquals("Test passed.", instance.getMessage());
    }

    /**
     * Test of getName method, of class Test.
     */
    @Test
    public void testGetName() {
        assertEquals("test1", instance.getName());

    }

    /**
     * Test of getResult method, of class Test.
     */
    @Test
    public void testGetResult() {
        assertEquals(com.yahoo.platform.yuitest.results.Test.PASS, instance.getResult());

    }

    /**
     * Test of getStackTrace method, of class Test.
     */
    @Test
    public void testGetStackTrace() {
        //TODO
    }

    /**
     * Test of getDuration method, of class Test.
     */
    @Test
    public void testGetDuration() {
        assertEquals(50, instance.getDuration());

    }

    /**
     * Test of setStackTrace method, of class Test.
     */
    @Test
    public void testSetStackTrace() {
        instance.setStackTrace("Hello");
        assertEquals("Hello", instance.getStackTrace());
    }

    /**
     * Test of getPath method, of class Test.
     */
    @Test
    public void testGetPath() {
        assertEquals("", instance.getPath());
        assertEquals("test1", instance.getFullPath());
    }

    /**
     * Test of getPath method, of class Test.
     */
    @Test
    public void testGetPathWithParent() {
        TestCase testCase = new TestCase("testcase1", 20, 1, 2, 0);
        testCase.addTest(instance);
        assertEquals("testcase1", instance.getPath("."));
        assertEquals("testcase1.test1", instance.getFullPath("."));
    }

}