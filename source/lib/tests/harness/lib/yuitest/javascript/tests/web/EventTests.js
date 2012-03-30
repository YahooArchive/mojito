(function(){

    var Assert          = YUITest.Assert,
        ObjectAssert    = YUITest.ObjectAssert;
        
    //-------------------------------------------------------------------------
    // Generic Event Test Case
    //-------------------------------------------------------------------------
    
    function GenericEventTestCase(type /*:String*/){
        YUITest.TestCase.call(this);
        this.eventType = type;
        this.name = "Event '" + type + "' Tests";
        this.result = null;
        this.element = null;
        this.elementTagName = "div";
    }

    GenericEventTestCase.prototype = YUITest.Util.mix(new YUITest.TestCase(), {
    
        //---------------------------------------------------------------------
        // Setup and teardown of test harnesses
        //---------------------------------------------------------------------
        
        /*
         * Sets up several event handlers used to test UserAction mouse events.
         */
        setUp : function() /*:Void*/{
        
            //create the element
            this.element = document.createElement(this.elementTagName);
            document.body.appendChild(this.element);
            
            //reset the result
            this.result = null;
            
            var that = this;
            this.element["on" + this.eventType] = function(event){
                that.handleEvent(event || window.event);
            };
        },
        
        /*
         * Removes event handlers that were used during the test.
         */
        tearDown : function() /*:Void*/{
        
            //remove the element
            document.body.removeChild(this.element);

            //remove event handler
            this.element["on" + this.eventType] = null;              
        },
        
        //---------------------------------------------------------------------
        // Event handler
        //---------------------------------------------------------------------
        
        /*
         * Uses to trap and assign the event object for interrogation.
         * @param {Event} event The event object created from the event.
         */
        handleEvent : function(event /*:Event*/) /*:Void*/ {
            this.result = event;
        }
    });

    //-------------------------------------------------------------------------
    // UIEvent Test Case
    //-------------------------------------------------------------------------

    function UIEventTestCase(type){
        GenericEventTestCase.call(this, type);
        this.elementTagName = "input";
    }

    UIEventTestCase.prototype = YUITest.Util.mix(new GenericEventTestCase(), {

        /*
         * Tests with default options.
         */
        testDefault : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element);

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isFalse(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            
        }
    });
    
    //-------------------------------------------------------------------------
    // Focus/Blur Event Test Case
    //-------------------------------------------------------------------------

    function FocusBlurEventTestCase(type){
        GenericEventTestCase.call(this, type);
        this.elementTagName = "input";
    }

    FocusBlurEventTestCase.prototype = YUITest.Util.mix(new GenericEventTestCase(), {

        /*
         * Tests with default options.
         */
        testDefault : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element);

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isFalse(this.result.bubbles, "bubbles is incorrect.");
            Assert.isFalse(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            
        }
    });
    
    
    //-------------------------------------------------------------------------
    // MouseButtonEvent Test Case
    //-------------------------------------------------------------------------

    function MouseButtonEventTestCase(type /*:String*/){
        GenericEventTestCase.call(this, type);        
    }

    MouseButtonEventTestCase.prototype = YUITest.Util.mix(new GenericEventTestCase(), {
            
        //---------------------------------------------------------------------
        // Tests
        //---------------------------------------------------------------------
                
        /*
         * Tests with default options.
         */
        testDefault : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element);

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(0, this.result.button, "Button is incorrect.");
            
        },
        
        /*
         * Tests when using the right mouse button.
         */
        testRightBtn : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { button: 2 });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(2, this.result.button, "Button is incorrect.");
        },
        
        /*
         * Tests when using coordinates.
         */
        testCoords : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { clientX: 100, clientY: 150, screenX: 200, screenY: 250 });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(0, this.result.button, "Button is incorrect.");
            Assert.areEqual(100, this.result.clientX, "ClientX is incorrect.");
            Assert.areEqual(150, this.result.clientY, "ClientX is incorrect.");
            Assert.areEqual(200, this.result.screenX, "ScreenX is incorrect.");
            Assert.areEqual(250, this.result.screenY, "ScreenY is incorrect.");
        },
        
        /*
         * Tests UserAction.click() when using CTRL key.
         */
        testCtrlKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { ctrlKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(0, this.result.button, "Button is incorrect.");
            Assert.isTrue(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");
        },
        
        /*
         * Tests when using ALT key.
         */
        testAltKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { altKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(0, this.result.button, "Button is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isTrue(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");
        },
        
        /*
         * Tests when using Shift key.
         */
        testShiftKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { shiftKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(0, this.result.button, "Button is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isTrue(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");
        },
        
        /*
         * Tests when using Meta key.
         */
        testMetaKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { metaKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(0, this.result.button, "Button is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isTrue(this.result.metaKey, "MetaKey is incorrect.");
        }    
    
    });
    
    //-------------------------------------------------------------------------
    // MouseMovementEvent Test Case
    //-------------------------------------------------------------------------
    
    function MouseMovementEventTestCase(type /*:String*/) {
        MouseButtonEventTestCase.call(this,type);    
    }
    
    MouseMovementEventTestCase.prototype = YUITest.Util.mix(new MouseButtonEventTestCase(), {
        
    
        /*
         * Tests that the relatedTarget property is correct.
         */
        testRelatedTarget : function () /*:Void*/{
        
            //fire the click event
            YUITest.Event[this.eventType](this.element, { relatedTarget: document.body });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.areSame(window, this.result.view, "View is incorrect.");
            Assert.areEqual(1, this.result.detail, "Details is incorrect.");
            //Assert.areEqual(0, this.result.button, "Button is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");        
            Assert.areSame(document.body, this.result.relatedTarget || this.result.fromElement || this.result.toElement, "RelatedTarget is incorrect.");        
        }
    
    
    });
    

    //-------------------------------------------------------------------------
    // KeyEvent Test Case
    //-------------------------------------------------------------------------
    
    function KeyEventTestCase(type /*:String*/) {
        GenericEventTestCase.call(this,type);
    }
    
    KeyEventTestCase.prototype = YUITest.Util.mix(new GenericEventTestCase(), {
    
        /*
         * Tests that the default properties are correct.
         */
        testDefault : function () /*:Void*/{
        
            //fire the click event
            YUITest.Event[this.eventType](this.element);

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");        
      
        },
        
        /*
         * Tests UserAction.click() when using CTRL key.
         */
        testCtrlKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { ctrlKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.isTrue(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");
        },
        
        /*
         * Tests when using ALT key.
         */
        testAltKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { altKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isTrue(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");
        },
        
        /*
         * Tests when using Shift key.
         */
        testShiftKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { shiftKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isTrue(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");
        },
        
        /*
         * Tests when using Meta key.
         */
        testMetaKey : function () /*:Void*/{        
            
            //fire the click event
            YUITest.Event[this.eventType](this.element, { metaKey: true });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isTrue(this.result.metaKey, "MetaKey is incorrect.");
        }            
    
    
    });    
    
    //-------------------------------------------------------------------------
    // KeyDirection Test Case
    //-------------------------------------------------------------------------    
    
    function KeyDirectionEventTestCase(type /*:String*/){
        KeyEventTestCase.call(this, type);
    }    
    
    KeyDirectionEventTestCase.prototype = YUITest.Util.mix(new KeyEventTestCase(), {
    
        /*
         * Tests that the default properties are correct.
         */
        testKeyCode : function () /*:Void*/{
        
            //fire the click event
            YUITest.Event[this.eventType](this.element, { keyCode: 97 });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");        
            Assert.areEqual(97, this.result.keyCode, "KeyCode is incorrect.");
        }
    
    });
    
    //-------------------------------------------------------------------------
    // TextEvent Test Case
    //-------------------------------------------------------------------------
    
    function TextEventTestCase(type /*:String*/){
        KeyEventTestCase.call(this, type);
    }
    
    TextEventTestCase.prototype = YUITest.Util.mix(new KeyEventTestCase(), {
    
        /*
         * Tests that the default properties are correct.
         */
        testCharCode : function () /*:Void*/{
        
            //fire the click event
            YUITest.Event[this.eventType](this.element, { charCode: 97 });

            //test the data coming back
            Assert.isObject(this.result, "No event object created.");
            Assert.areSame(this.element, this.result.target || this.result.srcElement, "Target is not correct.");
            Assert.areEqual(this.eventType, this.result.type, "Event type is incorrect.");
            Assert.isTrue(this.result.bubbles, "bubbles is incorrect.");
            Assert.isTrue(this.result.cancelable, "Cancelable is incorrect.");
            Assert.isFalse(this.result.ctrlKey, "CtrlKey is incorrect.");
            Assert.isFalse(this.result.altKey, "AltKey is incorrect.");
            Assert.isFalse(this.result.shiftKey, "ShiftKey is incorrect.");
            Assert.isFalse(this.result.metaKey, "MetaKey is incorrect.");        
            Assert.areEqual(97, this.result.charCode || this.result.keyCode, "CharCode is incorrect.");
        }
    
    });        
    
    //-------------------------------------------------------------------------
    // UserAction Tests
    //-------------------------------------------------------------------------

    //the user action suite
    var suite /*:YUITest.TestSuite*/ 
        = new YUITest.TestSuite("Event Simulate Tests");
    
    var mouseEventsSuite /*:YUITest.TestSuite*/ 
        = new YUITest.TestSuite("MouseEvent Tests");
    suite.add(mouseEventsSuite);
    
    var keyEventsSuite /*:YUITest.TestSuite*/ 
        = new YUITest.TestSuite("KeyEvent Tests");
    suite.add(keyEventsSuite);

    var uiEventsSuite /*:YUITest.TestSuite*/ 
        = new YUITest.TestSuite("UIEvents Tests");
    suite.add(uiEventsSuite);

    //-------------------------------------------------------------------------
    // Mouse Tests
    //-------------------------------------------------------------------------
    mouseEventsSuite.add(new MouseButtonEventTestCase("click"));
    mouseEventsSuite.add(new MouseButtonEventTestCase("dblclick"));
    mouseEventsSuite.add(new MouseButtonEventTestCase("mousedown"));
    mouseEventsSuite.add(new MouseButtonEventTestCase("mouseup"));        
    mouseEventsSuite.add(new MouseMovementEventTestCase("mouseover"));
    mouseEventsSuite.add(new MouseMovementEventTestCase("mouseout"));
    
    //-------------------------------------------------------------------------
    // Key Tests
    //-------------------------------------------------------------------------
    keyEventsSuite.add(new KeyDirectionEventTestCase("keyup"));
    keyEventsSuite.add(new KeyDirectionEventTestCase("keydown"));
    keyEventsSuite.add(new TextEventTestCase("keypress"));        

    //-------------------------------------------------------------------------
    // UI Tests
    //-------------------------------------------------------------------------
    uiEventsSuite.add(new UIEventTestCase("change"));
    uiEventsSuite.add(new UIEventTestCase("select"));
    uiEventsSuite.add(new FocusBlurEventTestCase("blur"));
    uiEventsSuite.add(new FocusBlurEventTestCase("focus"));
     
    //add to the test runner
    YUITest.TestRunner.add(suite);

})();