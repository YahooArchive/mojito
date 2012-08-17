/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package com.yahoo.platform.yuitest.selenium;

import java.io.InputStream;
import java.util.LinkedList;
import java.util.List;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

/**
 *
 * @author Nicholas C. Zakas
 */
public class RawTestResultsParser {

    /**
     * Parses a raw YUI Test XML results stream and returns a SessionResult object.
     * @param in The stream to read the results from.
     * @throws Exception If a parsing error occurs.
     */
    public static SessionResult parse(InputStream in, final SessionResult result) throws Exception {

        SAXParserFactory spf = SAXParserFactory.newInstance();
        SAXParser parser = null;
        final List<String> messages = new LinkedList<String>();

        try {
            parser = spf.newSAXParser();
            parser.parse(in, new DefaultHandler(){

                @Override
                public void startElement(String uri, String localName, String qName, Attributes attributes) throws SAXException {
//                    if (qName.equals("test")){
//                        String testResult = attributes.getValue("result");
//                        if (testResult.equals("fail")){
//                            messages.add(String.format("%s: %s", attributes.getValue("name"), attributes.getValue("message")));
//                        }
//                    } else if (qName.equals("report")){
//                        result.setFailed(Integer.parseInt(attributes.getValue("failed")));
//                        result.setPassed(Integer.parseInt(attributes.getValue("passed")));
//                        result.setIgnored(Integer.parseInt(attributes.getValue("ignored")));
//                    }

                }

            });
            result.setMessages(messages.toArray(new String[messages.size()]));
            return result;
        } catch (ParserConfigurationException ex) {
            throw ex;
        }

    }
    
}
