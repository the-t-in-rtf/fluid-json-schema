/* global fluid, jQuery */
(function () {
    "use strict";

    fluid.defaults("gpii.tests.schema.errorBinder.base", {
        hideOnSuccess: false,
        inlineSchemaUrl: "/allSchemas",
        ajaxOptions: {
            url:      "/gated/POST",
            method:   "POST",
            headers: {
                "Accept": "application/json"
            }
        },
        schemaKey: "evolved.json",
        templates: {
            initial:     "errorBinder-viewport"
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
                                type:      "gpii.binder.transforms.stripEmptyString",
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
                                type:      "gpii.binder.transforms.stripEmptyString",
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
                                type:      "gpii.binder.transforms.stripEmptyString",
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
                                type:      "gpii.binder.transforms.stripEmptyString",
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

    fluid.defaults("gpii.tests.schema.errorBinder", {
        gradeNames: ["gpii.schemas.client.errorAwareForm", "gpii.tests.schema.errorBinder.base"]
    });

    fluid.defaults("gpii.tests.schema.errorBinder.clientSideValidation", {
        gradeNames: ["gpii.schemas.client.errorAwareForm.clientSideValidation.realTime", "gpii.tests.schema.errorBinder.base"]
    });
})(jQuery);

