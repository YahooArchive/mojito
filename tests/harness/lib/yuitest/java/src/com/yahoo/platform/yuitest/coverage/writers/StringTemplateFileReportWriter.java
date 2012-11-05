/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage.writers;

import com.yahoo.platform.yuitest.coverage.results.FileCoverageReport;
import com.yahoo.platform.yuitest.results.TestReport;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Writer;
import java.util.Date;
import org.antlr.stringtemplate.AttributeRenderer;
import org.antlr.stringtemplate.StringTemplate;
import org.antlr.stringtemplate.StringTemplateGroup;
import org.antlr.stringtemplate.language.DefaultTemplateLexer;

/**
 *
 * @author Nicholas C. Zakas
 */
public class StringTemplateFileReportWriter implements FileReportWriter {

    protected Writer out;
    protected StringTemplateGroup templateGroup;

    public StringTemplateFileReportWriter(Writer out, String format) throws IOException {
        this.out = out;
        this.templateGroup = getStringTemplateGroup(format);
    }

    private StringTemplateGroup getStringTemplateGroup(String format) throws IOException{
        //get string template group
        InputStream stgstream = StringTemplateFileReportWriter.class.getResourceAsStream(format + "FileReportTemplates.stg");
        InputStreamReader reader = new InputStreamReader(stgstream);
        StringTemplateGroup group = new StringTemplateGroup(reader, DefaultTemplateLexer.class);
        reader.close();
        return group;
    }

    public void write(FileCoverageReport report) throws IOException {
        write(report, new Date());
    }

    public void write(FileCoverageReport report, Date date) throws IOException {
        StringTemplate template = templateGroup.getInstanceOf("report");
        template.setAttribute("report", report);
        template.setAttribute("date", date);

        //renderer for strings
        template.registerRenderer(String.class, new AttributeRenderer(){

            public String toString(Object o) {
                return o.toString();
            }

            public String toString(Object o, String format) {
                if (format.equals("classname")){
                    return o.toString().replace(TestReport.PATH_SEPARATOR, ".").replaceAll("[^a-zA-Z0-9\\\\.]", "");
                } else if (format.equals("xmlEscape")){
                    return o.toString().replace("&", "&amp;").replace(">", "&gt;").replace("<", "&lt;").replace("\"", "&quot;").replace("'", "&apos;");
                } else if (format.equals("htmlEscape")){
                    return o.toString().replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
                } else if (format.equals("htmlEscapeSpace")){
                    return o.toString().replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;");
                } else {
                    return o.toString();
                }
            }
        });

        //renderer for numbers
        template.registerRenderer(Integer.class, new AttributeRenderer(){

            public String toString(Object o) {
                return o.toString();
            }

            public String toString(Object o, String format) {
                if (format.equals("ms_to_s")){
                    return String.valueOf(Double.parseDouble(o.toString()) / 1000);
                } else if (format.equals("padLeft5")){
                    int value = Integer.parseInt(o.toString());
                    String result = o.toString();
                    if (value > 9999){
                        return result;
                    } else if (value > 999){
                        return " " + result;
                    } else if (value > 99){
                        return "  " + result;
                    } else if (value > 9){
                        return "   " + result;
                    } else {
                        return "    " + result;
                    }
                } else {
                    return o.toString();
                }
            }
        });


        out.write(template.toString());
    }

    public void close() throws IOException {
        out.close();
    }
}
