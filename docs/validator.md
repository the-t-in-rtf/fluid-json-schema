# Validation

This package provides static functions that can be used to validate JSON data against [a GSS schema](./gss.md).

## Validation Functions

### `gpii.schema.validator.validate(toValidate, gssSchema, [ajvOptions])`

* `{Any} toValidate`: The material to be validated.
* `{Object} gssSchema`:A GSS schema definition.
* `{Object} ajvOptions`:Optional arguments to pass to the underlying AJV validator.
* Returns: An `{Object}` that describes the validation results.  See below for details.

This function validates material against a "GPII Schema System" schema, and returns an object describing the results.
If there are no validation errors, the return value should look like:

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
         "message": "validation-required-field-missing"
     },
     {
         "dataPath": ["deep", "booleanField"],
         "schemaPath": ["properties", "deep", "properties", "booleanField", "type"],
         "rule": { "type": "boolean" },
         "message": "validation-invalid-field-type"
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
       "message": "my-custom-error"
   }]
}
```

You can refer to each of these in your message template using an EL Path.  So, for example, you might define a message
bundle that looked like:

```json
{
    "my-custom-error": "The value you provided (%data) is not a number."
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

## Defaults

### `gpii.schema.validator.defaultI18nKeysByRule`

For each type of error there is a default message key.  This bundle of defaults has a string template for each of these.
Any message keys that cannot be found in your message bundle will be looked up against this map and the default string
template will be used instead.

### `gpii.schema.validator.defaultLocalisationTransformRules`

By default, the `error` (validation error) and `data` (the value that broke the rule) are exposed.  See above for an
example of changing this behaviour.
