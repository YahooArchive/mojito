/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.config;

import java.io.IOException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import org.xml.sax.SAXException;

/**
 *
 * @author Nicholas C. Zakas
 */
public class TestConfigTest {

    private TestConfig config;

    public TestConfigTest() {
    }

    @Before
    public void setUp() throws SAXException, IOException {
        config = new TestConfig();
        config.load(TestConfigTest.class.getResourceAsStream("tests.xml"));
    }

    @After
    public void tearDown() {
        config = null;
    }


    @Test
    public void testGroupCount(){
        assertEquals(2, config.getGroups().length);
    }

    @Test
    public void testGroupSettings(){

        TestPageGroup group = config.getGroups()[0];

        //make sure the group's properties are correct
        assertEquals(3, group.getVersion());
        assertEquals("http://www.example.com/tests/", group.getBase());
        assertEquals(10000, group.getTimeout());
    }

    @Test
    public void testGroupPage(){
        TestPage page = config.getGroups()[0].getTestPages()[0];

        //make sure each test page's properties are correct
        assertEquals("test1", page.getPath());
        assertEquals("http://www.example.com/tests/test1", page.getAbsolutePath());
        assertEquals(3, page.getVersion());
        assertEquals(10000, page.getTimeout());
    }

    @Test
    public void testGroupPageWithTimeoutOverride(){
        TestPage page = config.getGroups()[0].getTestPages()[1];

        //make sure each test page's properties are correct
        assertEquals("test2/more", page.getPath());
        assertEquals("http://www.example.com/tests/test2/more", page.getAbsolutePath());
        assertEquals(3, page.getVersion());
        assertEquals(50000, page.getTimeout());
    }

    @Test
    public void testGroupPageWithVersionOverride(){
        TestPage page = config.getGroups()[0].getTestPages()[2];
        //make sure each test page's properties are correct
        assertEquals("test3/more?a=b", page.getPath());
        assertEquals("http://www.example.com/tests/test3/more?a=b", page.getAbsolutePath());
        assertEquals(2, page.getVersion());
        assertEquals(10000, page.getTimeout());
    }

    @Test
    public void testGroupPageWitQueryStringArguments(){
        TestPage page = config.getGroups()[0].getTestPages()[3];

        //make sure each test page's properties are correct
        assertEquals("test4/more?a=b&c=d", page.getPath());
        assertEquals("http://www.example.com/tests/test4/more?a=b&c=d", page.getAbsolutePath());
        assertEquals(3, page.getVersion());
        assertEquals(10000, page.getTimeout());
    }


}