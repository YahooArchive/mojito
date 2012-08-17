/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.writers;

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
public class StringTemplateWriter<T> implements ReportWriter<T> {

    protected Writer out;
    protected StringTemplateGroup templateGroup;

    public StringTemplateWriter(Writer out, String groupName) throws IOException {
        this.out = out;
        this.templateGroup = getStringTemplateGroup(groupName);
    }

    private StringTemplateGroup getStringTemplateGroup(String groupName) throws IOException{
        //get string template group
        InputStream stgstream = StringTemplateWriter.class.getResourceAsStream(groupName + ".stg");
        InputStreamReader reader = new InputStreamReader(stgstream);
        StringTemplateGroup group = new StringTemplateGroup(reader, DefaultTemplateLexer.class);
        reader.close();
        return group;
    }

    public void write(T report) throws IOException {
        write(report, new Date());
    }

    public void write(T report, Date date) throws IOException {
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
                } else if (format.equals("relativePath")){
                    return o.toString().replaceAll("[^\\\\\\/]+", "..");
                } else if (format.equals("fullPath")){
                    return o.toString().replaceFirst("^[\\\\\\/]+", "");  //for files like /home/username/foo, remove first /
                } else if (format.equals("fullRelativePath")){
                    return toString(toString(o, "fullPath"), "relativePath");
                } else {
                    return o.toString();
                }
            }
        });

        //renderer for numbers
        template.registerRenderer(Integer.class, new AttributeRenderer(){

            private int count=1;

            public String toString(Object o) {
                return o.toString();
            }

            public String toString(Object o, String format) {
                if (format.equals("count")){
                    return String.valueOf(count++);
                } else if (format.equals("ms_to_s")){
                    return String.valueOf(Double.parseDouble(o.toString()) / 1000);
                } else if (format.startsWith("padLeft")){
                    String num = o.toString();
                    int max = Integer.parseInt(format.substring(7));
                    while(num.length() < max){
                        num = " " + num;
                    }
                    return num;
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
