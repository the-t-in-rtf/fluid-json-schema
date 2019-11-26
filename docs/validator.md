# Validation

## `gpii.schema.validator`

This package provides a global validator that is instantiated when requiring this package from node, or when including
the validator source from a browser.  Once you have done either, you can access the global validator using an IoC
reference, as shown in the example at end of this page.

### Component Invokers

### `{gpii.schema.validator}.validate(toValidate, gssSchema, [schemaHash])`

* `{Object} gssSchema`: A GSS schema definition.
* `{Any} toValidate`: The material to be validated.
* `{String} [schemaHash]`: An optional schema hash precomputed using `gpii.schema.hashSchema` (see below).
* Returns: An `{Object}` that describes the validation results.  See below for details.

This function validates material against [a "GPII Schema System" schema](./gss.md), and returns an object describing
the results. If there are no validation errors, the return value should look like:

```json
{ "isValid": true }
```

If there are validation errors, the return value should look like:

```json
{
 "isValid": false,
 "errors": [
     {
         "dataPath": ["requiredField"],
         "schemaPath": ["properties", "requiredField", "required"],
         "rule": { "required": true },
         "message": "gpii.schema.messages.validationErrors.required"
     },
     {
         "dataPath": ["deep", "booleanField"],
         "schemaPath": ["properties", "deep", "properties", "booleanField", "type"],
         "rule": { "type": "boolean" },
         "message": "gpii.schema.messages.validationErrors.type"
     }
 ]
}
```

The `message` values are "keys" that can be resolved to human-readable text using the
`gpii.schema.validator.localiseErrors` function described below.

If a low-level error occurs while attempting to validate the data, a separate `isError` property will be set to `true`
and the raw error message will be displayed in a top-level `messages` element, as in:

```json
{
  "isError": true,
  "message": "Invalid GSS Schema."
}
```

### `{gpii.schema.validator}.clearCache()`

* Returns: Nothing.

As the compilation of a schema is quite expensive, the global validator has an internal cache that stores a compiled
version of each schema that has been used for validation.  This cache can be cleared by calling the validation
component's `clearCache` invoker.  You can also add or remove single schemas from the cache, see below for details.

### `{gpii.schema.validator}.cacheSchema(gssSchema, [schemaHash])`

* `{Object} gssSchema`: A GSS schema definition.
* `{String} [schemaHash]`: An optional schema hash precomputed using `gpii.schema.stringify`.
* Returns: The validator created by compiling the schema.

If a schema has not already been cached, it is cached the first time it is used by `{gpii.schema.validator}.validate`
(see above).  You can use this invoker to cache a schema ahead of time.

### `{gpii.schema.validator}.forgetSchema(gssSchema, [schemaHash])`

* `{Object} gssSchema`: A GSS schema definition.
* `{String} [schemaHash]`: An optional schema hash precomputed using `gpii.schema.stringify`.
* Returns: Nothing.

Remove a single schema from the internal cache.

## Error Message Internationalisation/Localisation

### `gpii.schema.validator.localiseErrors(validationErrors, [validatedData], [messages], [localisationTransform])`

* `{Array<Object>} validationErrors`:An array of validation errors.
* `{Any} validatedData`:The (optional) data that was validated.
* `{Object} messages`:An (optional) map of message templates (see below).  Will always fail over to the default message
  bundle provided by this package (see below).
* `{Object} localisationTransform`:An optional set of rules that control what information is available when localising
  validation errors (see above).
* Returns: An `{Array}` containing one or more validation errors, with all message keys replaced with localised strings.

This function takes the validation output returned by `gpii.schema.validator.validate` (see above) and replaces all
message keys with strings rendered using
[`fluid.stringTemplate`](https://docs.fluidproject.org/infusion/development/CoreAPI.html#fluidstringtemplatetemplate-terms).

If you want to pass a custom message bundle to this function, it should only contain top-level elements, see
./src/js/validation-errors.js in this package for an example.

By default, this rendering process has access to an object like the following:

```json
{
    "data": "Not a number!",
    "errors": [{
       "dataPath": [
           "foo"
       ],
       "schemaPath": [
           "properties",
           "foo",
           "type"
       ],
       "rule": {
           "type": "number"
       },
       "message": "my.namespace.messages.customError"
   }]
}
```

You can refer to each of these in your message template using an EL Path.  So, for example, you might define a message
bundle that looked like:

```json
{
    "my.namespace.messages.customError": "The value you provided (%data) is not a number."
}
```

You can control what is exposed and how  by passing in a `localisationTransform` option.  By default, the error itself
is exposed as an `error` element, and the data that failed validation is exposed as `data`.  If you wanted to avoid
exposing the data in logs or onscreen (for example, when working with passwords), you could use a transform like the
following:

```json
{
  "error": "error"
}
```

### Defaults

#### `gpii.schema.validator.defaultI18nKeysByRule`

For each type of error there is a default message key.  This bundle of defaults has a string template for each of these.
Any message keys that cannot be found in your message bundle will be looked up against this map and the default string
template will be used instead.

#### `gpii.schema.validator.defaultLocalisationTransformRules`

By default, the `error` (validation error) and `data` (the value that broke the rule) are exposed.  See above for an
example of changing this behaviour.

## `gpii.schema.hashSchema(gssSchema)`

* `{Object} gssSchema`: A GSS schema definition.
* Returns: A unique `{String}` hash representing the GSS Schema.

Many of the global validation component's invokers accept a "schema hash", which is used to look up the schema in the
validation component's internal cache.  This static API function is provided to allow you to hash your schema content
yourself.  If this value is supplied to one of the above invokers, a small amount of time is saved versus calculating
the hash multiple times from the raw schema.  Each hash typically takes less than 1 millisecond, so the default invokers
and grades do not store the hashed value.  This function is provided for use cases where an additional 1ms makes a real
difference in perceived performance, and the process of storing and passing around the schema hash is left up to the
implementer.

## Example Usage

Here is an example of how you might make use of the global validator in your own component.

```javascript
/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.require("%gpii-json-schema");
var gpii = fluid.registerNamespace("gpii");

var my = fluid.registerNamespace("my");

fluid.registerNamespace("my.validating.component");

my.validating.component.validateInput = function (that, globalValidator, toValidate) {
    var validationResults = globalValidator.validate(that.options.schema, toValidate);
    if (validationResults.isValid) {
        return { isValid: true };
    }
    else {
        return { isValid: false, errors: gpii.schema.validator.localiseErrors(validationResults.errors, toValidate) };
    }
};

fluid.defaults("my.validating.component", {
    gradeNames: ["fluid.component"],
    schema: {
        "$schema": "gss-v7-full#",
        type: "object",
        properties: {
            foo: {
                type: "boolean",
                required: true
            }
        }
    },
    invokers: {
        validateInput: {
            funcName: "my.validating.component.validateInput",
            args: ["{that}", "{gpii.schema.validator}", "{arguments}.0"]
        }
    }
});

var myValidatingComponent = my.validating.component();

var validationResults = myValidatingComponent.validateInput({});
fluid.log(JSON.stringify(validationResults, null, 2));
/*
    {
      "isValid": false,
      "errors": [
        {
          "message": "This value is required.",
          "dataPath": [
            "foo"
          ],
          "schemaPath": [
            "properties",
            "foo",
            "required"
          ],
          "rule": {
            "type": "boolean",
            "required": true
          }
        }
      ]
    }
*/

var secondValidationResults = myValidatingComponent.validateInput({ foo: true});
fluid.log(JSON.stringify(secondValidationResults, null, 2));
/*
    {
      isValid: true
    }
*/
```

In the above example, the invoker definition includes an IoC reference to the global component in its `args` block.
