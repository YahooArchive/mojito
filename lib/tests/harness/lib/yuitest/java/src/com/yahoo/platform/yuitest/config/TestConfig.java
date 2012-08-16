/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.config;

import com.yahoo.platform.yuitest.selenium.*;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

/**
 * Represents all tests that need to be executed.
 * @author Nicholas C. Zakas
 */
public class TestConfig {

    private TestPageGroup[] groups;

    /**
     * Creates a new instance.
     */
    public TestConfig(){
    }

    /**
     * Loads test configuration information from the specific input stream.
     * @param in The stream to read the data from.
     * @throws SAXException When there's an XML parse error.
     * @throws IOException When the input stream can't be read.
     */
    public void load(InputStream in) throws SAXException, IOException {
        SAXParserFactory spf = SAXParserFactory.newInstance();
        SAXParser parser = null;
        final List<TestPageGroup> groupsList = new LinkedList<TestPageGroup>();

        try {
            parser = spf.newSAXParser();
            parser.parse(in, new DefaultHandler(){

                private int version = 4;
                private TestPageGroup currentGroup = null;
                private TestPage currentPage = null;

                @Override
                public void characters(char[] ch, int start, int length) throws SAXException {
                    if (currentPage != null){
                        currentPage.setPath(currentPage.getPath() + new String(ch, start, length));
                    }
                }

                @Override
                public void startElement(String uri, String localName, String qName, Attributes attributes) throws SAXException {
                    if (qName.equals("yuitest")){
                        String ver = attributes.getValue("version");
                        if (ver != null){
                            version = Integer.parseInt(ver);
                        }
                    } else if (qName.equals("tests")){
                        String ver = attributes.getValue("version");
                        String timeout = attributes.getValue("timeout");
                        currentGroup = new TestPageGroup(attributes.getValue("base"), (ver == null ? version : Integer.parseInt(ver)), (timeout == null ? -1 : Integer.parseInt(timeout)));
                        groupsList.add(currentGroup);
                    } else if (qName.equals("url")){

                        //make sure it's inside of a group
                        if (currentGroup == null){
                            throw new SAXException("<url> must be within <tests>");
                        }
                        String ver = attributes.getValue("version");
                        String timeout = attributes.getValue("timeout");
                        currentPage = new TestPage("", (ver == null ? currentGroup.getVersion() : Integer.parseInt(ver)), (timeout == null ? currentGroup.getTimeout() : Integer.parseInt(timeout)));
                        currentGroup.add(currentPage);
                    }
                }

                @Override
                public void endElement(String uri, String localName, String qName) throws SAXException {
                    if (qName.equals("tests")){
                        currentGroup = null;
                    } else if (qName.equals("url")){
                        currentPage = null;
                    }
                }

            });
        } catch (ParserConfigurationException ex) {
            Logger.getLogger(TestConfig.class.getName()).log(Level.SEVERE, null, ex);
        }

        groups = groupsList.toArray(new TestPageGroup[groupsList.size()]);
    }

    /**
     * Returns all groups.
     * @return All groups.
     */
    public TestPageGroup[] getGroups(){
        return groups;
    }
}
