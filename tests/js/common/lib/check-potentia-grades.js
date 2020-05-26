/* globals require */
/* eslint-env browser */
var fluid  = fluid  || {};

(function (fluid) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        fluid.require("%gpii-json-schema");
    }

    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.test.schema");

    /**
     *
     * Confirm that the context-based approach to handling both potentia-ii and mainline Infusion is working.
     * @param {Object} component - The component to be inspected.
     * @param {Object} jqUnit - The instance of jqUnit to use to check assertions.
     *
     */
    gpii.test.schema.checkContextGrades = function (component, jqUnit) {
        var isPotentiaTwo = gpii.schema.component.hasRegisterPotentia();

        if (isPotentiaTwo) {
            jqUnit.assertTrue("The resulting component should have the 'potentia ii' grade mixed in.", fluid.componentHasGrade(component, "gpii.schema.component.potentiaII"));
            jqUnit.assertFalse("The resulting component should not have the 'legacy' grade mixed in.", fluid.componentHasGrade(component, "gpii.schema.component.legacy"));
        }
        else {
            jqUnit.assertFalse("The resulting component should not have the 'potentia ii' grade mixed in.", fluid.componentHasGrade(component, "gpii.schema.component.potentiaII"));
            jqUnit.assertTrue("The resulting component should have the 'legacy' grade mixed in.", fluid.componentHasGrade(component, "gpii.schema.component.legacy"));
        }
    };
})(fluid);
