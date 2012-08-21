/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.writers;

import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import org.antlr.stringtemplate.StringTemplate;

/**
 * Provides basic string template loading for writers.
 * @author Nicholas C. Zakas
 */
public abstract class AbstractStringTemplateReportWriter {

    protected Writer out;
    protected String templateName;
    protected StringTemplate template;

    protected AbstractStringTemplateReportWriter(Writer out, String templateName){
        this.out = out;
        this.templateName = templateName;
        this.template = getStringTemplate();
    }

    /**
     * Closes the writer.
     * @throws IOException
     */
    public void close() throws IOException {
        out.close();
    }

    /**
     * Retrieves a StringTemplate with the given name from the JAR.
     * @param name The name of the StringTemplate to retrieve.
     * @return A StringTemplate object.
     */
    protected StringTemplate getStringTemplate(){
        InputStream stream = null;
        try {
            stream = AbstractStringTemplateReportWriter.class.getResource(templateName + ".st").openStream();
            StringBuilder builder = new StringBuilder();
            int c;
            while ((c = stream.read()) != -1) {
                builder.append((char) c);
            }
            return new StringTemplate(builder.toString());

        } catch (IOException ex) {
            throw new IllegalArgumentException("Couldn't open " + templateName);
        } finally {
            try {
                stream.close();
            } catch (IOException ex) {
                //ignore
            }
        }
    }
}
