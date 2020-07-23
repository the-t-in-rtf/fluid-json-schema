(function (fluid) {
    "use strict";

    fluid.defaults("fluid.tests.schema.errorBinder", {
        gradeNames: ["fluid.schema.client.errorAwareForm"],
        hideOnSuccess: false,
        ajaxOptions: {
            url:      "/gated/POST",
            method:   "POST",
            json: true,
            headers: {
                "Accept": "application/json"
            }
        },
        modelSchema: {
            "properties": {
                "testString": {
                    "type": "string",
                    "minLength": 4,
                    "maxLength": 9,
                    "pattern": ".*CAT.*"
                },
                "testAllOf": {
                    "allOf": [{ "type": "string" }, { "minLength": 4 }, { "maxLength": 9 }, { "pattern": ".*CAT.*" }]
                },
                "deep": {
                    "type": "object",
                    "properties": {
                        "deeplyRequired": {
                            "type": "string",
                            required: true
                        }
                    }
                },
                "hasNoErrorsMetadata": {
                    "type": "string",
                    "minLength": 3
                },
                "definedDirectly": {
                    "type": "string",
                    "maxLength": 1
                },
                "definedDirectlyHasNoErrorsMetadata": {
                    "type": "string",
                    "maxLength": 1
                },
                "shallowlyRequired": { required: true}
            }
        },
        templateKeys: {
            initial: "errorBinder-viewport"
        },
        rules: {
            modelToRequestPayload: {
                "":                "notfound",
                shallowlyRequired: "shallowlyRequired",
                testString:        "testString",
                testAllOf:         "testAllOf",
                succeed:           "succeed",
                deep: {
                    deeplyRequired: "deeplyRequired"
                }
            }
        },
        model: {
        },
        bindings: {
            // We use both styles of bindings to confirm that they each work with the `errorBinder`.
            shallowlyRequired: {
                selector: "shallowlyRequired",
                path:     "shallowlyRequired",
                rules: {
                    domToModel: {
                        "": {
                            transform: {
                                type:      "fluid.binder.transforms.stripEmptyString",
                                inputPath: ""
                            }
                        }
                    }
                }
            },
            testString: {
                selector: "testString",
                path:     "testString",
                rules: {
                    domToModel: {
                        "": {
                            transform: {
                                type:      "fluid.binder.transforms.stripEmptyString",
                                inputPath: ""
                            }
                        }
                    }
                }
            },
            testAllOf: {
                selector: "testAllOf",
                path:     "testAllOf",
                rules: {
                    domToModel: {
                        "": {
                            transform: {
                                type:      "fluid.binder.transforms.stripEmptyString",
                                inputPath: ""
                            }
                        }
                    }
                }
            },
            deeplyRequired: {
                selector: "deeplyRequired",
                path:     "deeplyRequired",
                rules: {
                    domToModel: {
                        "": {
                            transform: {
                                type:      "fluid.binder.transforms.stripEmptyString",
                                inputPath: ""
                            }
                        }
                    }
                }
            },
            succeed: "succeed"
        },
        selectors: {
            shallowlyRequired: "input[name='shallowlyRequired']",
            testString:        "input[name='testString']",
            testAllOf:         "input[name='testAllOf']",
            deeplyRequired:    "input[name='deeplyRequired']",
            succeed:           "input[name='succeed']"
        }
    });
})(fluid, jQuery);
