/* global fluid, jQuery, jqUnit */
var fluid = fluid || {};
(function (fluid, $, jqUnit) {
    "use strict";
    fluid.setLogging(true);
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.tests.schema.errorBinder");

    gpii.tests.schema.errorBinder.checkElements = function (elementDefs) {
        fluid.each(elementDefs, function (elementDef) {
            var elements = fluid.makeArray($(elementDef.selector));
            jqUnit.assertEquals("We should find the right number of elements.", elementDef.expectedElements, elements.length);

            fluid.each(elements, function (element) {
                if (elementDef.mustMatch) {
                    fluid.each(fluid.makeArray(elementDef.mustMatch), function (matchingPattern) {
                        jqUnit.assertTrue("The element should match the pattern '" + matchingPattern + "'.", $(element).text().match(matchingPattern));
                    });
                }
                if (elementDef.mustNotMatch) {
                    fluid.each(fluid.makeArray(elementDef.mustNotMatch), function (nonMatchingPattern) {
                        jqUnit.assertFalse("The element should not match the pattern '" + nonMatchingPattern + "'.", $(element).text().match(nonMatchingPattern));
                    });
                }
            });
        });
    };

    gpii.tests.schema.errorBinder.changeModelValue = function (environment, componentName, valuePath, valueToSet) {
        var component = fluid.get(environment, componentName);
        component.applier.change(valuePath, valueToSet, valueToSet !== null ? "ADD" : "DELETE");
    };

    gpii.tests.schema.errorBinder.submitForm = function (selector) {
        $(selector).submit();
    };


    fluid.defaults("gpii.tests.schema.errorBinder.startSequenceElement", {
        gradeNames: ["fluid.test.sequenceElement"],
        sequence: [
            { func: "{testEnvironment}.events.constructFixtures.fire" },
            {
                event: "{testEnvironment}.events.onFixturesReady",
                listener: "fluid.identity"
            },
            // Crude additional pause to give the component and all sub-components a chance to (re)render.
            {
                func: "{testEnvironment}.startPause",
                args: [150] // timeToPauseInMs
            },
            {
                event: "{testEnvironment}.events.onPauseComplete",
                listener: "fluid.identity"
            }
        ]
    });

    // If I leave the teardown and reconstruction to createOnEvent, I end up with errors about not being able to call
    // `removeListener`, so I destroy the component myself here.
    fluid.defaults("gpii.tests.schema.errorBinder.stopSequenceElement", {
        gradeNames: ["fluid.test.sequenceElement"],
        sequence: [{ func: "{testEnvironment}.errorBinder.destroy" }]
    });

    fluid.defaults("gpii.tests.schema.errorBinder.sequenceGrade", {
        gradeNames: ["fluid.test.sequence"],
        sequenceElements: {
            start: {
                priority:   "before:sequence",
                gradeNames: "gpii.tests.schema.errorBinder.startSequenceElement"
            },
            stop: {
                priority:   "after:sequence",
                gradeNames: "gpii.tests.schema.errorBinder.stopSequenceElement"
            }
        }
    });

    fluid.defaults("gpii.tests.schema.errorBinder.caseHolder", {
        gradeNames: ["fluid.test.testCaseHolder"],
        modules: [{
            name:  "Testing the client-side error binder component...",
            tests: [
                {
                    name: "Confirm that initial client-side validation errors appear correctly after startup...",
                    sequenceGrade: "gpii.tests.schema.errorBinder.sequenceGrade",
                    sequence: [
                        {
                            func: "gpii.tests.schema.errorBinder.checkElements",
                            args: [[
                                // Summary message.
                                {
                                    selector: ".errorBinder-viewport .fieldErrors",
                                    mustMatch: "The information you provided is incomplete or incorrect",
                                    expectedElements: 1
                                },
                                // Field-level validation message.
                                {
                                    selector: ".errorBinder-viewport .fieldError",
                                    mustMatch: "This value is required.",
                                    expectedElements: 1
                                }
                            ]]
                        }
                    ]
                },
                {
                    name: "Confirm that feedback on a required field is set and unset as needed...",
                    sequenceGrade: "gpii.tests.schema.errorBinder.sequenceGrade",
                    sequence: [
                        {
                            func: "gpii.tests.schema.errorBinder.changeModelValue",
                            args: ["{testEnvironment}", "errorBinder", "shallowlyRequired", "has a value"] // environment, componentName, valuePath, valueToSet
                        },
                        {
                            event: "{testEnvironment}.events.onFixturesReady",
                            func: "{testEnvironment}.startPause",
                            args: [1050] // timeToPauseInMs
                        },
                        {
                            event: "{testEnvironment}.events.onPauseComplete",
                            listener: "gpii.tests.schema.errorBinder.checkElements",
                            args: [[
                                // Summary message.
                                {
                                    selector: ".errorBinder-viewport .fieldErrors",
                                    expectedElements: 0
                                },
                                // Field-level validation message.
                                {
                                    selector: ".errorBinder-viewport .fieldError",
                                    expectedElements: 0
                                }
                            ], "{testEnvironment}"]
                        },
                        {
                            func: "gpii.tests.schema.errorBinder.changeModelValue",
                            args: ["{testEnvironment}", "errorBinder", "shallowlyRequired", null] // environment, componentName, valuePath, valueToSet
                        },
                        // Crude pause to give various components a chance to rerender.
                        {
                            func: "{testEnvironment}.startPause",
                            args: [150] // timeToPauseInMs
                        },
                        {
                            event: "{testEnvironment}.events.onPauseComplete",
                            listener: "gpii.tests.schema.errorBinder.checkElements",
                            args: [[
                                // Summary message.
                                {
                                    selector: ".errorBinder-viewport .fieldErrors",
                                    mustMatch: "The information you provided is incomplete or incorrect",
                                    expectedElements: 1
                                },
                                // Field-level validation messages.
                                {
                                    selector: ".errorBinder-viewport .fieldError",
                                    mustMatch: "This value is required.",
                                    expectedElements: 1
                                }
                            ]]
                        }
                    ]
                },
                {
                    name: "Confirm that multiple errors can be set and cleared in real time...",
                    sequenceGrade: "gpii.tests.schema.errorBinder.sequenceGrade",
                    sequence: [
                        {
                            func: "gpii.tests.schema.errorBinder.changeModelValue",
                            args: ["{testEnvironment}", "errorBinder", "testAllOf", "CAT"] // environment, componentName, valuePath, valueToSet
                        },
                        // Crude pause to give various components a chance to rerender.
                        {
                            func: "{testEnvironment}.startPause",
                            args: [150] // timeToPauseInMs
                        },
                        {
                            event: "{testEnvironment}.events.onPauseComplete",
                            listener: "gpii.tests.schema.errorBinder.checkElements",
                            args: [[
                                // Summary message.
                                {
                                    selector: ".errorBinder-viewport .fieldErrors",
                                    mustMatch: "The information you provided is incomplete or incorrect",
                                    expectedElements: 1
                                },
                                // Field-level validation messages.
                                {
                                    selector: ".errorBinder-viewport .fieldError",
                                    expectedElements: 2
                                }
                            ]]
                        },
                        {
                            func: "gpii.tests.schema.errorBinder.changeModelValue",
                            args: ["{testEnvironment}", "errorBinder", "testAllOf", "CAT NAP"] // environment, componentName, valuePath, valueToSet
                        },
                        {
                            func: "gpii.tests.schema.errorBinder.changeModelValue",
                            args: ["{testEnvironment}", "errorBinder", "shallowlyRequired", "There is now text."] // environment, componentName, valuePath, valueToSet
                        },
                        // Crude pause to give various components a chance to rerender.
                        {
                            func: "{testEnvironment}.startPause",
                            args: [150] // timeToPauseInMs
                        },
                        {
                            event: "{testEnvironment}.events.onPauseComplete",
                            listener: "gpii.tests.schema.errorBinder.checkElements",
                            args: [[
                                // Summary message.
                                {
                                    selector: ".errorBinder-viewport .fieldErrors",
                                    expectedElements: 0
                                },
                                // Field-level validation messages.
                                {
                                    selector: ".errorBinder-viewport .fieldError",
                                    expectedElements: 0
                                }
                            ]]
                        }
                    ]
                },
                {
                    name: "Confirm that form submission is prevented if there are validation errors...",
                    sequenceGrade: "gpii.tests.schema.errorBinder.sequenceGrade",
                    sequence: [
                        {
                            func: "gpii.tests.schema.errorBinder.submitForm",
                            args: [".errorBinder-viewport form"] // selector
                        },
                        // If the page were reloaded by a form submit, we would not exist to ever finish this run.
                        // Crude pause to give various components a chance to rerender.
                        {
                            func: "{testEnvironment}.startPause",
                            args: [150] // timeToPauseInMs
                        },
                        {
                            event: "{testEnvironment}.events.onPauseComplete",
                            listener: "gpii.tests.schema.errorBinder.checkElements",
                            args: [[
                                // Summary message.
                                {
                                    selector: ".errorBinder-viewport .fieldErrors",
                                    mustMatch: "The information you provided is incomplete or incorrect",
                                    expectedElements: 1
                                },
                                // Field-level validation messages.
                                {
                                    selector: ".errorBinder-viewport .fieldError",
                                    mustMatch: "This value is required.",
                                    expectedElements: 1
                                }
                            ]]
                        }
                    ]
                },
                {
                    name: "Confirm that form submission succeeeds if there are no validation errors...",
                    sequenceGrade: "gpii.tests.schema.errorBinder.sequenceGrade",
                    sequence: [
                        {
                            func: "gpii.tests.schema.errorBinder.changeModelValue",
                            args: ["{testEnvironment}", "errorBinder", "shallowlyRequired", "has a value"] // environment, componentName, valuePath, valueToSet
                        },
                        // Crude pause to give various components a chance to rerender.
                        {
                            func: "{testEnvironment}.startPause",
                            args: [150] // timeToPauseInMs
                        },
                        {
                            event: "{testEnvironment}.events.onPauseComplete",
                            listener: "gpii.tests.schema.errorBinder.submitForm",
                            args: [".errorBinder-viewport form"] // selector
                        },
                        // If the page were reloaded by a form submit, we would not exist to ever finish this run.
                        // Crude pause to give various components a chance to rerender.
                        {
                            event: "{testEnvironment}.errorBinder.events.requestReceived",
                            listener: "{testEnvironment}.startPause",
                            args: [150] // timeToPauseInMs
                        },
                        {
                            event: "{testEnvironment}.events.onPauseComplete",
                            listener: "gpii.tests.schema.errorBinder.checkElements",
                            args: [[
                                // Success message
                                {
                                    selector: ".errorBinder-viewport .templateFormControl-success",
                                    mustMatch: "Nothing can be ill.",
                                    expectedElements: 1
                                },
                                // Summary message.
                                {
                                    selector: ".errorBinder-viewport .fieldErrors",
                                    expectedElements: 0
                                },
                                // Field-level validation messages.
                                {
                                    selector: ".errorBinder-viewport .fieldError",
                                    expectedElements: 0
                                }
                            ]]
                        }
                    ]
                }
            ]
        }]
    });

    fluid.defaults("gpii.tests.schema.errorBinder.environment", {
        gradeNames: ["fluid.test.testEnvironment"],
        markupFixture: ".errorBinder-viewport",
        events: {
            constructFixtures: null,
            onFixturesReady:   null,
            onPauseComplete:   null
        },
        invokers: {
            startPause: {
                funcName: "setTimeout",
                args: ["{that}.events.onPauseComplete.fire", "{arguments}.0"] // timeToPauseInMs
            }
        },
        components: {
            caseHolder: {
                type: "gpii.tests.schema.errorBinder.caseHolder"
            },
            errorBinder: {
                type:      "gpii.tests.schema.errorBinder",
                createOnEvent: "constructFixtures",
                container: ".errorBinder-viewport",
                options: {
                    listeners: {
                        "onRendererAvailable.notifyParent": {
                            func: "{testEnvironment}.events.onFixturesReady.fire"
                        }
                    }
                }
            }
        }
    });
    fluid.test.runTests("gpii.tests.schema.errorBinder.environment");
})(fluid, jQuery, jqUnit);
