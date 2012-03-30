/*
 * YUI Test
 * Author: Nicholas C. Zakas <nzakas@yahoo-inc.com>
 * Copyright (c) 2009, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License:
 *     http://developer.yahoo.net/yui/license.txt
 */

package com.yahoo.platform.yuitest.coverage;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.io.Writer;
import org.antlr.runtime.ANTLRReaderStream;
import org.antlr.runtime.TokenRewriteStream;
import org.antlr.runtime.RecognitionException;
import org.antlr.stringtemplate.StringTemplate;
import org.antlr.stringtemplate.StringTemplateGroup;

/**
 *
 * @author Nicholas C. Zakas
 */
public class JavaScriptInstrumenter {

    private Reader in;
    private String name;
    private String path;

    public JavaScriptInstrumenter(Reader in, String name){
        this(in, name, name);
    }

    public JavaScriptInstrumenter(Reader in, String name, String path){
        this.in = in;
        this.name = name;
        this.path = path;
    }

    public void instrument(Writer out, boolean verbose) throws IOException, RecognitionException {

        //get string headerTemplate group
        InputStream stgstream = JavaScriptInstrumenter.class.getResourceAsStream("ES3YUITestTemplates.stg");
        InputStreamReader reader = new InputStreamReader(stgstream);
        StringTemplateGroup group = new StringTemplateGroup(reader);
        reader.close();

        //get headerTemplate for file header
        StringTemplate headerTemplate = group.getInstanceOf("file_header");
        headerTemplate.setAttribute("src", name);
        headerTemplate.setAttribute("path", path.replace("\\", "\\\\"));

        //read lines for later usage
        BufferedReader lineReader = new BufferedReader(in);
        StringBuilder codeLines = new StringBuilder();
        StringBuilder code = new StringBuilder();
        String line = null;
        codeLines.append("_yuitest_coverage[\"");
        codeLines.append(name);
        codeLines.append("\"].code=[");

        while((line = lineReader.readLine()) != null){
            
            //build up array of lines
            codeLines.append("\"");
            codeLines.append(line.replace("\\", "\\\\").replace("\"", "\\\""));
            codeLines.append("\",");   
            
            //build up source code
            code.append(line);
            code.append("\n");
        }
        
        
        switch (codeLines.charAt(codeLines.length()-1)){
            case ',':  //if there's a dangling comma, replace it
                codeLines.setCharAt(codeLines.length()-1, ']');
                break;
            case '[':  //empty file
                codeLines.append("]");
                break;
            //no default
        }
        codeLines.append(";");

        //output full path

        //setup parser
        ANTLRReaderStream stream = new ANTLRReaderStream(new StringReader(code.toString()));
        stream.name = name;
        ES3YUITestLexer lexer = new ES3YUITestLexer(stream);
        TokenRewriteStream tokens = new TokenRewriteStream(lexer);
        ES3YUITestParser parser = new ES3YUITestParser(tokens);
        parser.setTemplateLib(group);
        //parser.setVerbose(verbose);

        String result = "";

        //an empty string will cause the parser to explode
        if (code.toString().trim().length() > 0){
            parser.program();
            result = tokens.toString();
        }
    
        //close input stream in case writing to the same place
        in.close(); in = null;

        //output the resulting file
        out.write(headerTemplate.toString());
        out.write("\n");
        out.write(codeLines.toString());
        out.write("\n");
        out.flush();
        out.write(result);
        out.flush();
    }


}
