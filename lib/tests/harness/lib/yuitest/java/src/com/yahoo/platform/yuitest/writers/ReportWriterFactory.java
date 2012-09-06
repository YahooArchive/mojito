/*
 *  YUI Test
 *  Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 *  Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 *  Code licensed under the BSD License:
 *      http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.writers;

import java.io.Writer;

/**
 *
 * @author Nicholas C. Zakas
 */
public class ReportWriterFactory<T> {

    public ReportWriterFactory(){
        
    }

    public  ReportWriter<T> getWriter(Writer out, String groupName) {
        try {
            return new StringTemplateWriter<T>(out, groupName);
        } catch(Exception ex){
            throw new IllegalArgumentException(String.format("No writer for '%s' found.", groupName));
        }
    }
}
