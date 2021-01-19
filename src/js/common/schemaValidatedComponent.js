/* globals require */
/* eslint-disable-next-line no-redeclare */
var fluid  = fluid  || require("infusion");
(function (fluid) {
    "use strict";

    if (fluid.require) {
        require("./validator");
    }

    fluid.registerNamespace("fluid.schema.component");

    /**
     *
     * @param {Object} shadowRecord - A "shadow record", which is a version of the component available during the potentia-ii workflow.
     *
     */
    fluid.schema.component.validateShadowRecord = function (shadowRecord) {
        fluid.schema.component.validateComponent(shadowRecord.that);
    };

    /**
     *
     * Validate a component's options based on its schema.  For "potentia ii" (future) versions of Infusion, a "shadow"
     * record is validated as part of the component's workflow.  For "legacy" (pre potentia II) versions, the record
     * itself is validated on component creation.  The distinction is handled by a context-aware core grade that mixes
     * in a grade with the correct strategy to use.
     *
     * We have our own validation code here because the global validator is not available in the context of a
     * potentia-ii workflow.
     *
     * @param {fluid.schema.component} componentToValidate - The component to validate.
     *
     */
    fluid.schema.component.validateComponent = function (componentToValidate) {
        if (fluid.componentHasGrade(componentToValidate, "fluid.schema.component")) {
            var validator;
            var isValid = false;
            try {
                validator = fluid.schema.validator.compileSchema(componentToValidate.options.schema);
                isValid = validator(componentToValidate);
            }
            catch (compileErrors) {
                fluid.fail({ isError: true, message: "Invalid FSS Schema.", errors: compileErrors });
            }

            if (!isValid) {
                var standardisedErrors = fluid.schema.validator.standardiseAjvErrors(componentToValidate.options.schema, validator.errors);
                var localisedValidationErrors = fluid.schema.validator.localiseErrors(standardisedErrors.errors);
                var errorReport = "";
                fluid.each(localisedValidationErrors, function (localisedError) {
                    var failurePath = localisedError.dataPath.length ? localisedError.dataPath.join(" -> ") : "(root)";
                    errorReport += "\n\t" + failurePath + ":\t" + localisedError.message;
                });
                fluid.fail("Component does not match its own schema, aborting component creation:" + errorReport);
            }
        }
    };

    fluid.schema.component.hasRegisterPotentia = function () {
        return fluid.registerPotentia ? true : false;
    };

    fluid.contextAware.makeChecks({
        "fluid.hasRegisterPotentia": "fluid.schema.component.hasRegisterPotentia"
    });

    // Validate the component as part of its startup "workflow".
    fluid.defaults("fluid.schema.component.potentiaII", {
        gradeNames: ["fluid.component"],
        workflows: {
            local: {
                validateOptions: {
                    priority: "after:concludeComponentObservation",
                    funcName: "fluid.schema.component.validateShadowRecord"
                }
            }
        }
    });

    // For components that don't have a workflow, validate on the `onCreate` event.
    fluid.defaults("fluid.schema.component.legacy", {
        gradeNames: ["fluid.component"],
        listeners: {
            "onCreate.validate": {
                funcName: "fluid.schema.component.validateComponent",
                args:     ["{that}"]
            }
        }
    });

    fluid.defaults("fluid.schema.component", {
        gradeNames: ["fluid.component", "fluid.contextAware"],
        schema: {
            "$schema": "fss-v7-full#"
        },
        contextAwareness: {
            validationStrategy: {
                checks: {
                    hasRegisterPotentia: {
                        contextValue: "{fluid.hasRegisterPotentia}",
                        gradeNames: "fluid.schema.component.potentiaII"
                    },
                    legacy: {
                        contextValue: "{fluid.hasRegisterPotentia}",
                        equals: false,
                        gradeNames: "fluid.schema.component.legacy"
                    }
                }
            }
        }
    });
})(fluid);
