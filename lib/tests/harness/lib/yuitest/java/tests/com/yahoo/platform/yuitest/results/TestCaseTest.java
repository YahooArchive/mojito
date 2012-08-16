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
public class TestCaseTest {

    private TestCase instance;

    public TestCaseTest() {
    }

    @Before
    public void setUp() {
        instance = new TestCase("testcase1", 50, 5, 3, 1);
    }

    @After
    public void tearDown() {
        instance = null;
    }

    /**
     * Test of addTest method, of class TestCase.
     */
    @Test
    public void testAddTest() {
        com.yahoo.platform.yuitest.results.Test test = new com.yahoo.platform.yuitest.results.Test("test1", 50, 0, null);
        instance.addTest(test);

        assertEquals(1, instance.getTests().length);
        assertEquals(test, instance.getTests()[0]);
        assertEquals(instance, test.getParent());
    }

    /**
     * Test of getDuration method, of class TestCase.
     */
    @Test
    public void testGetDuration() {
        assertEquals(50, instance.getDuration());
    }

    /**
     * Test of getFailed method, of class TestCase.
     */
    @Test
    public void testGetFailed() {
        assertEquals(3, instance.getFailed());
    }

    /**
     * Test of getIgnored method, of class TestCase.
     */
    @Test
    public void testGetIgnored() {
        assertEquals(1, instance.getIgnored());

    }

    /**
     * Test of getName method, of class TestCase.
     */
    @Test
    public void testGetName() {
        assertEquals("testcase1", instance.getName());

    }

    /**
     * Test of getPassed method, of class TestCase.
     */
    @Test
    public void testGetPassed() {
        assertEquals(5, instance.getPassed());
    }

    /**
     * Test of getPath method, of class TestCase.
     */
    @Test
    public void testGetPath() {
        assertEquals("", instance.getPath());
        assertEquals("testcase1", instance.getFullPath());
    }

}