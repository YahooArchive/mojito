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
 * @author Nicholas C. Zakas
 */
public class TestSuiteTest {

    private TestSuite instance;

    public TestSuiteTest() {
    }

    @Before
    public void setUp() {
        instance = new TestSuite("testsuite1", 50, 5, 3, 2);
    }

    @After
    public void tearDown() {
        instance = null;
    }

    /**
     * Test of addTestSuite method, of class TestSuite.
     */
    @Test
    public void testAddTestSuite() {
        TestSuite suite = new TestSuite("testsuite2", 30, 3, 2, 1);
        instance.addTestSuite(suite);
        assertEquals(1, instance.getTestSuites().length);
        assertEquals(suite, instance.getTestSuites()[0]);
        assertEquals("testsuite1", suite.getPath());
        assertEquals("testsuite1\\testsuite2", suite.getFullPath());
        assertEquals(instance, suite.getParent());

    }

    /**
     * Test of addTestCase method, of class TestSuite.
     */
    @Test
    public void testAddTestCase() {
        TestCase testCase = new TestCase("testcase1", 30, 3, 2, 1);
        instance.addTestCase(testCase);

        assertEquals(1, instance.getTestCases().length);
        assertEquals(testCase, instance.getTestCases()[0]);
        assertEquals("testsuite1", testCase.getPath());
        assertEquals("testsuite1\\testcase1", testCase.getFullPath());
        assertEquals(instance, testCase.getParent());
    }

    /**
     * Test of getDuration method, of class TestSuite.
     */
    @Test
    public void testGetDuration() {
        assertEquals(50, instance.getDuration());
    }

    /**
     * Test of getFailed method, of class TestSuite.
     */
    @Test
    public void testGetFailed() {
        assertEquals(3, instance.getFailed());
    }

    /**
     * Test of getName method, of class TestSuite.
     */
    @Test
    public void testGetName() {
        assertEquals("testsuite1", instance.getName());
    }

    /**
     * Test of getPassed method, of class TestSuite.
     */
    @Test
    public void testGetPassed() {
        assertEquals(5, instance.getPassed());
    }

    /**
     * Test of getIgnored method, of class TestSuite.
     */
    @Test
    public void testGetIgnored() {
        assertEquals(2, instance.getIgnored());
    }


    /**
     * Test of getPath method, of class TestSuite.
     */
    @Test
    public void testGetPath() {
        assertEquals("", instance.getPath());
        assertEquals("testsuite1", instance.getFullPath());
    }

}