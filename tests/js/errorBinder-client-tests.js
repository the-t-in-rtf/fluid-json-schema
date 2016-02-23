"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-test-browser");
gpii.tests.browser.loadTestingSupport();

require("./test-harness");

fluid.registerNamespace("gpii.schema.tests.errorBinder");

// Client side function to count the errors (requires jQuery)
gpii.schema.tests.errorBinder.countSelectors = function (selector) {
    /*  globals $ */
    return $(selector).length;
};

fluid.defaults("gpii.schema.tests.errorBinder.caseHolder", {
    gradeNames: ["gpii.tests.browser.caseHolder.withExpress"],
    // All of our tests follow the same pattern, start everything, then open a page.
    sequenceStart: [
        {
            func: "{testEnvironment}.events.constructFixtures.fire"
        },
        {
            event: "{testEnvironment}.events.onReady",
            listener: "fluid.identity"
        },
        // These must be separate otherwise the framework will complain that the browser might not exist yet. (Even though it should).
        {
            func: "{testEnvironment}.browser.goto",
            args: ["{testEnvironment}.options.url"]
        },
        // TODO:  Remove this in favor of listening for "onSchemasUpdated" on the client side once https://issues.gpii.net/browse/GPII-1574 is resolved.
        {
            event:    "{testEnvironment}.browser.events.onGotoComplete",
            listener: "{testEnvironment}.browser.wait",
            args:     [500]
        },
        {
            event:    "{testEnvironment}.browser.events.onWaitComplete",
            listener: "fluid.identity"
        }
    ],
    rawModules: [{
        tests: [
            {
                name: "Confirm that initial validation errors appear correctly after startup...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.evaluate",
                        args: [gpii.tests.browser.tests.lookupFunction, ".fieldErrors", "innerText"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["The error summary should be as expected...", "The information you provided is incomplete or incorrect. Please check the following:\n\nThe 'shallowlyRequired' field is required.\n", "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.browser.evaluate",
                        args: [gpii.tests.browser.tests.lookupFunction, ".shallowlyRequired-block .fieldError", "innerText"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["An inline error should be as expected...", "The 'shallowlyRequired' field is required.", "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Confirm that feedback on a required field is set and unset as needed...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.type",
                        args: ["input[name='shallowlyRequired']", "There is text now."]
                    },
                    // We have to click somewhere else to change focus and trigger a binder update.
                    {
                        event:    "{testEnvironment}.browser.events.onTypeComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     [".focusPoint"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.exists",
                        args:     [".fieldErrors"]
                    },
                    {
                        listener: "jqUnit.assertFalse",
                        event: "{testEnvironment}.browser.events.onExistsComplete",
                        args: ["There should no longer be an error summary...", "{arguments}.0"]
                    },

                    {
                        func: "{testEnvironment}.browser.exists",
                        args: [".fieldError"]
                    },
                    {
                        listener: "jqUnit.assertFalse",
                        event:    "{testEnvironment}.browser.events.onExistsComplete",
                        args:     ["There should no longer be any field-level errors...", "{arguments}.0"]
                    }
                    //,
                    // TODO: Enable these steps once https://issues.gpii.net/browse/GPII-1580 is resolved.
                    //{
                    //    func: "{testEnvironment}.browser.insert",
                    //    args: ["input[name='shallowlyRequired']", null]
                    //},
                    //// We have to click somewhere else to change focus and trigger a binder update.
                    //{
                    //    event: "{testEnvironment}.browser.events.onTypeComplete",
                    //    func: "{testEnvironment}.browser.click",
                    //    args: [".focusPoint"]
                    //},
                    //{
                    //    event: "{testEnvironment}.browser.events.onClickComplete",
                    //    listener: "{testEnvironment}.browser.exists",
                    //    args: [".fieldErrors"]
                    //},
                    //{
                    //    listener: "jqUnit.assertTrue",
                    //    event: "{testEnvironment}.browser.events.onExistsComplete",
                    //    args: ["There should now be an error summary...", "{arguments}.0"]
                    //},
                    //
                    //{
                    //    func: "{testEnvironment}.browser.exists",
                    //    args: [".shallowlyRequired-block .fieldError"]
                    //},
                    //{
                    //    listener: "jqUnit.assertTrue",
                    //    event: "{testEnvironment}.browser.events.onExistsComplete",
                    //    args: ["There should now be a field-level errors...", "{arguments}.0"]
                    //}
                ]
            },
            {
                name: "Confirm that multiple errors can be set and cleared in real time...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.type",
                        args:     ["input[name='testAllOf']", "CAT"]
                    },
                    // We have to click somewhere else to change focus and trigger a binder update.
                    {
                        event:    "{testEnvironment}.browser.events.onTypeComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     [".focusPoint"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onClickComplete",
                        listener:  "{testEnvironment}.browser.evaluate",
                        args:      [gpii.schema.tests.errorBinder.countSelectors, ".fieldError"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should now be two field errors...", 2, "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.browser.type",
                        args: ["input[name='shallowlyRequired']", "There is text now."]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onTypeComplete",
                        listener: "{testEnvironment}.browser.type",
                        args:     ["input[name='testAllOf']", "CATs"]
                    },
                    // We have to click somewhere else to change focus and trigger a binder update.
                    {
                        event:    "{testEnvironment}.browser.events.onTypeComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     [".focusPoint"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onClickComplete",
                        listener:  "{testEnvironment}.browser.evaluate",
                        args:      [gpii.schema.tests.errorBinder.countSelectors, ".fieldError"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should now be no field errors...", undefined, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Confirm that form submission is prevented if there are validation errors...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.click",
                        args:     [".submit"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onClickComplete",
                        listener:  "{testEnvironment}.browser.evaluate",
                        args:      [gpii.schema.tests.errorBinder.countSelectors, ".fieldError"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should still be 1 field error...", 1, "{arguments}.0"]
                    },
                    {
                        func:  "{testEnvironment}.browser.evaluate",
                        args:  [gpii.schema.tests.errorBinder.countSelectors, ".success .alert-box"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should still be no new success message...", undefined, "{arguments}.0"]
                    },
                    {
                        func:  "{testEnvironment}.browser.evaluate",
                        args:  [gpii.schema.tests.errorBinder.countSelectors, ".error .alert-box"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should still be only one top level error message...", 1, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Confirm that underlying server-side messages are still displayed correctly...",
                sequence: [
                    // Test a single successful submission
                    {
                        func: "{testEnvironment}.browser.type",
                        args: ["input[name='shallowlyRequired']", "There is text now."]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onTypeComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     [".submit"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onClickComplete",
                        listener:  "{testEnvironment}.browser.evaluate",
                        args:      [gpii.schema.tests.errorBinder.countSelectors, ".success .alert-box"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should now be a success message...", 1, "{arguments}.0"]
                    },
                    // Test a success response followed by a failure, to confirm that the right response (and only that one) is displayed.
                    {
                        func: "{testEnvironment}.browser.uncheck",
                        args: ["input[name='succeed']"]
                    },
                    // We have to click somewhere else to change focus and trigger a binder update.
                    {
                        event:    "{testEnvironment}.browser.events.onUncheckComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     [".submit"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.evaluate",
                        args: [gpii.schema.tests.errorBinder.countSelectors, ".error .alert-box"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should now be an error message...", 1, "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.browser.evaluate",
                        args: [gpii.schema.tests.errorBinder.countSelectors, ".success .alert-box"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should no longer be a success message...", undefined, "{arguments}.0"]
                    },
                    // Test an error response followed by a success, to confirm that the right response (and only that one) is displayed.
                    {
                        func: "{testEnvironment}.browser.check",
                        args: ["input[name='succeed']"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onCheckComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     [".submit"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onClickComplete",
                        listener:  "{testEnvironment}.browser.evaluate",
                        args:      [gpii.schema.tests.errorBinder.countSelectors, ".success .alert-box"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should now be a success message...", 1, "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.browser.evaluate",
                        args: [gpii.schema.tests.errorBinder.countSelectors, ".error .alert-box"]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.browser.events.onEvaluateComplete",
                        args: ["There should no longer be an error message...", undefined, "{arguments}.0"]
                    }
                ]
            }
        ]
    }]
});


fluid.defaults("gpii.schema.tests.errorBinder.environment", {
    gradeNames: ["gpii.tests.browser.environment.withExpress"],
    port:   6984,
    url: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["http://localhost:%port/content/errorBinder-tests.html", {port: "{that}.options.port"}]
        }
    },
    components: {
        express: {
            type: "gpii.schema.tests.harness",
            options: {
                port: "{testEnvironment}.options.port"
            }
        },
        browser: {
            options: {
                listeners: {
                    "onError": {
                        funcName: "fluid.log",
                        args: ["BROWSER ERROR:", "{arguments}.0"]
                    }
                }
            }
        },
        caseHolder: {
            type: "gpii.schema.tests.errorBinder.caseHolder"
        }
    }
});

gpii.schema.tests.errorBinder.environment();