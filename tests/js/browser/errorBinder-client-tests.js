/* eslint-env node */
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);
var gpii  = fluid.registerNamespace("gpii");

require ("gpii-webdriver");
gpii.webdriver.loadTestingSupport();

require("../lib/harness");

fluid.registerNamespace("gpii.tests.schema.errorBinder");

fluid.defaults("gpii.tests.schema.errorBinder.caseHolder", {
    gradeNames: ["gpii.test.webdriver.caseHolder"],
    // All of our tests follow the same pattern, start everything, then open a page.
    sequenceStart: [
        {
            func: "{testEnvironment}.events.constructFixtures.fire"
        },
        {
            event: "{testEnvironment}.events.onFixturesConstructed",
            listener: "fluid.identity"
        },
        // These must be separate otherwise the framework will complain that the browser might not exist yet. (Even though it should).
        {
            func: "{testEnvironment}.webdriver.get",
            args: ["{testEnvironment}.options.url"]
        },
        {
            event:    "{testEnvironment}.webdriver.events.onGetComplete",
            listener: "{testEnvironment}.webdriver.wait",
            args:     [gpii.webdriver.until.elementLocated({css: ".fieldError"})]
        },
        {
            event:    "{testEnvironment}.webdriver.events.onWaitComplete",
            listener: "fluid.identity"
        }
    ],
    rawModules: [{
        name:  "Testing the client-side error binder component...",
        tests: [
            {
                name: "Confirm that initial client-side validation errors appear correctly after startup...",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [{ css: ".errorBinder-clientSideValidation-viewport .fieldErrors"}]
                    },
                    {
                        listener: "gpii.test.webdriver.inspectElement",
                        event: "{testEnvironment}.webdriver.events.onFindElementComplete",
                        args: ["The error summary should be as expected...", "{arguments}.0", "getText", "The information you provided is incomplete or incorrect. Please check the following:\nThe 'shallowlyRequired' field is required."] // message, element, elementFn, expectedValue, jqUnitFn
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [{ css: ".errorBinder-clientSideValidation-viewport .shallowlyRequired-block .fieldError"}]
                    },
                    {
                        listener: "gpii.test.webdriver.inspectElement",
                        event: "{testEnvironment}.webdriver.events.onFindElementComplete",
                        args: ["An inline error should be as expected...", "{arguments}.0", "getText", "The 'shallowlyRequired' field is required."] // message, element, elementFn, expectedValue, jqUnitFn
                    }
                ]
            },
            {
                name: "Confirm that feedback on a required field is set and unset as needed...",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='shallowlyRequired']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args: [[
                            { fn: "click",    args: ["{arguments}.0"]},
                            { fn: "sendKeys", args: ["There is text now.", gpii.webdriver.Key.TAB]}
                        ]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args:     [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .fieldErrors")]
                    },
                    {
                        listener: "jqUnit.assert",
                        event:    "{testEnvironment}.webdriver.events.onError",
                        args:     ["There should no longer be an error summary..."]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .fieldError")]
                    },
                    {
                        listener: "jqUnit.assert",
                        event:    "{testEnvironment}.webdriver.events.onError",
                        args:     ["There should no longer be any field-level errors..."]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='shallowlyRequired']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args:     [[
                            { fn: "click",    args: ["{arguments}.0"]},
                            { fn: "sendKeys", args: fluid.generate(20, gpii.webdriver.Key.ARROW_RIGHT) },
                            { fn: "sendKeys", args: fluid.generate(20, gpii.webdriver.Key.BACK_SPACE) },
                            { fn: "sendKeys", args: [gpii.webdriver.Key.TAB]}
                        ]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args:     [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .fieldErrors")]
                    },
                    {
                        listener: "jqUnit.assert",
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        args:     ["There should now be an error summary..."]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .fieldError")]
                    },
                    {
                        listener: "jqUnit.assert",
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        args:     ["There should now be field-level errors..."]
                    }
                ]
            },
            {
                name: "Confirm that multiple errors can be set and cleared in real time...",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='testAllOf']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args: [[
                            { fn: "click",    args: ["{arguments}.0"]},
                            { fn: "sendKeys", args: ["CAT", gpii.webdriver.Key.TAB]}
                        ]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener:  "{testEnvironment}.webdriver.findElements",
                        args:      [gpii.webdriver.By.css(".fieldError")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event: "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args: ["There should now be two field errors...", 2, "{arguments}.0.length"]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='shallowlyRequired']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args: [[
                            { fn: "click",    args: ["{arguments}.0"]},
                            { fn: "sendKeys", args: ["There is text now.", gpii.webdriver.Key.TAB]}
                        ]]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='testAllOf']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args: [[
                            { fn: "click",    args: ["{arguments}.0"]},
                            { fn: "sendKeys", args: [" NAP", gpii.webdriver.Key.TAB]}
                        ]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.findElements",
                        args:     [gpii.webdriver.By.css(".fieldError")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should now be no field errors...", 0, "{arguments}.0.length"]
                    }
                ]
            },
            {
                name: "Confirm that form submission is prevented if there are validation errors...",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .submit")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args:     [[{ fn: "click",    args: ["{arguments}.0"]}]]
                    },
                    {
                        event:     "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener:  "{testEnvironment}.webdriver.findElements",
                        args:      [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .fieldError")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should still be 1 field error...", 1, "{arguments}.0.length"]
                    },
                    {
                        func:  "{testEnvironment}.webdriver.findElements",
                        args:  [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .templateFormControl-success .callout")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should still be no new success message...", 0, "{arguments}.0.length"]
                    },
                    {
                        func:  "{testEnvironment}.webdriver.findElements",
                        args:  [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .templateFormControl-error .callout")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should still be only one top level error message...", 1, "{arguments}.0.length"]
                    }
                ]
            },
            {
                name: "Confirm that underlying server-side messages are displayed correctly...",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.wait",
                        args: [gpii.webdriver.until.elementLocated({css: ".errorBinder-clientSideValidation-viewport .callout.alert"})]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onWaitComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args:     [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='shallowlyRequired']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args: [[
                            { fn: "click",    args: ["{arguments}.0"]},
                            { fn: "sendKeys", args: ["Here is some text.", gpii.webdriver.Key.ENTER]}
                        ]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args:     [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='succeed']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args:     [[{ fn: "click",    args: ["{arguments}.0"]}]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args:     [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .submit")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args:     [[{ fn: "click",    args: ["{arguments}.0"]}]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.wait",
                        args:     [gpii.webdriver.until.elementLocated({ css: ".errorBinder-clientSideValidation-viewport .templateFormControl-error .callout"})]
                    },
                    {
                        listener: "jqUnit.assert",
                        event:    "{testEnvironment}.webdriver.events.onWaitComplete",
                        args:     ["There should now be an error message..."]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElements",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .templateFormControl-success .callout")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should no longer be a success message...", 0, "{arguments}.0.length"]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport input[name='succeed']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args:     [[{ fn: "click",    args: ["{arguments}.0"]}]]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args:     [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .submit")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args:     [[{ fn: "click",    args: ["{arguments}.0"]}]]
                    },
                    {
                        event:     "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.wait",
                        args:     [gpii.webdriver.until.elementLocated({ css: ".errorBinder-clientSideValidation-viewport .success.callout"})]
                    },
                    {
                        listener: "jqUnit.assert",
                        event:    "{testEnvironment}.webdriver.events.onWaitComplete",
                        args:     ["There should be a success message after the second submission..."]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElements",
                        args: [gpii.webdriver.By.css(".errorBinder-clientSideValidation-viewport .templateFormControl-error .callout")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should no longer be an error message after the second submission...", 0, "{arguments}.0.length"]
                    }
                ]
            },
            {
                name: "Confirm that server-side validation errors are displayed correctly...",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.findElement",
                        args: [gpii.webdriver.By.css(".errorBinder-viewport input[name='testAllOf']")]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "{testEnvironment}.webdriver.actionsHelper",
                        args: [[
                            { fn: "click",    args: ["{arguments}.0"]},
                            { fn: "sendKeys", args: ["CAT", gpii.webdriver.Key.ENTER]}
                        ]]
                    },
                    {
                        event:     "{testEnvironment}.webdriver.events.onActionsHelperComplete",
                        listener: "{testEnvironment}.webdriver.wait",
                        args:     [gpii.webdriver.until.elementLocated({ css: ".errorBinder-viewport .callout.alert"})]
                    },
                    {
                        event:    "{testEnvironment}.webdriver.events.onWaitComplete",
                        listener: "{testEnvironment}.webdriver.findElements",
                        args:     [gpii.webdriver.By.css(".errorBinder-viewport .templateFormControl-error > .callout.alert")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should be an error summary and the server's `message` as well...", 2, "{arguments}.0.length"]
                    },
                    {
                        func: "{testEnvironment}.webdriver.findElements",
                        args: [gpii.webdriver.By.css(".errorBinder-viewport .fieldError")]
                    },
                    {
                        listener: "jqUnit.assertEquals",
                        event:    "{testEnvironment}.webdriver.events.onFindElementsComplete",
                        args:     ["There should be two field-level errors...", 2, "{arguments}.0.length"]
                    }
                ]
            }
        ]
    }]
});


fluid.defaults("gpii.tests.schema.errorBinder.environment", {
    gradeNames: ["gpii.test.webdriver.testEnvironment.withExpress"],
    port:   6984,
    url: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["http://localhost:%port/content/errorBinder-tests.html", {port: "{that}.options.port"}]
        }
    },
    components: {
        express: {
            type: "gpii.test.schema.harness",
            options: {
                port: "{testEnvironment}.options.port"
            }
        },
        caseHolder: {
            type: "gpii.tests.schema.errorBinder.caseHolder"
        }
    }
});
gpii.test.webdriver.allBrowsers({ baseTestEnvironment: "gpii.tests.schema.errorBinder.environment"});
