# Fluid Schema System

## Introduction

[JSON](http://json.org) is a way of representing a subset of Javascript objects in a way that can be serialised for
storage and transmission.  Among other things, it is useful in enforcing API contracts by verifying user input against
a schema.

JSON itself only introduces rudimentary practical constraints on what can be entered.  We need a way of constraining
what can be entered, of describing what is allowed (and not allowed) in a JSON payload.

The emerging [JSON Schema draft standard](http://json-schema.org) provides a reasonable starting point.  The Fluid Schema
System (FSS) is based on the underlying JSON Schema language, and:

1. Allows us to validate configuration options and user input.
2. Better integrates with Fluid components as used extensively throughout the fluid.
3. Adds UI hints that can be used when generating user interfaces based on an FSS schema, as is done within the PPT.
4. Adds the ability to customise validation error messages.
5. Allows internationalisation of both UI hints and validation error messages.

The FSS consists of:

1. An FSS "metaschema", which describes in JSON Schema format the rules that can be used to define an FSS Schema (see
   below).
2. A validator which can validate arbitrary JSON payloads against an FSS schema.
3. Base Fluid component grades that validate component options against an FSS schema on startup.
4. Base Fluid component grades that validate model changes against an FSS schema in real time.

## FSS Schemas

For a good background on the underlying language, check out [this guide from the Space Telescope Science Institute](https://spacetelescope.github.io/understanding-json-schema/)

FSS Schemas are very similar to JSON Schemas, but not entirely identical.  Notably:

1. The `required` attribute is a property of the element which is required, rather than a property of the object that
   contains the required element.
2. The `$ref` attribute used to create advanced JSON Schemas is not supported within an FSS Schema.
3. FSS Schemas add an `enumLabels` element, which is used to provide labels for `enum` fields.
4. FSS Schemas add an `errors` element, which can be use to customise validation errors.
5. FSS Schemas add a `hint` element, which can be used to provide instructions when generating UIs based on an FSS
   Schema.

### The `required` field.

### The `enumLabels`, `errors`, and `hint` attributes.

Each of the added attributes is intended to work with i18n message bundles.  Each "message key" can be resolved to a
single string template, of the type used with
[`fluid.stringTemplate`](https://docs.fluidproject.org/infusion/development/CoreAPI.html#fluidstringtemplatetemplate-terms).

Let's assume we have the following message bundle:

```json
{
    "my.package.messages.emailHint":    "Please enter a valid email address.",
    "my.package.messages.emailInvalid": "The email you entered (%email) is invalid.",
    "my.package.messages.nameHint":     "Please enter a valid email address.",
    "my.package.messages.nameInvalid":  "The name you entered (%name) is invalid.",
    "my.package.messages.nameTooLong":  "The name you entered must be %maxLength characters or less.",
    "my.package.messages.badgeRed":     "Red",
    "my.package.messages.badgeGreen":   "Green",
    "my.package.messages.badgeBlue":    "Blue"
}
```

We can make use of the above message keys in an FSS Schema that looks like:

```json
{
    "$schema": "fss-v7-full#",
    "properties": {
        "name": {
            "type": "string",
            "maxLength": 100,
            "required": true,
            "hint": "my.package.messages.nameHint",
            "errors": {
                "": "my.package.messages.nameInvalid",
                "maxLength": "my.package.messages.nameTooLong"
            }
        },
        "email": {
            "type": "string",
            "required": true,
            "format": "email",
            "hint": "my.package.messages.emailHint",
            "errors": {
                "" : "my.package.messages.emailInvalid"
            }
        },
        "badgeColor": {
            "enum": ["#ff0000", "#00ff00", "#0000ff"],
            "enumLabels": ["my.package.messages.badgeRed", "my.package.messages.badgeGreen", "my.package.messages.badgeBlue"]
        }
    }
}
```

Let's talk first about the `hint` element.  A single `hint` is allowed for a given element, and the value is expected to
be an i18n message key.  In an HTML UI, this might be displayed near the field to be entered using an html `<label>`
element.

The `errors` element is somewhat more complex, as an element may have failed validation for a number of reasons.  The
`errors` element is an object, each of whose keys directly matches a rule for the described element.  So, in the above
`name` example, we provide a specific message for cases in which the `maxLength` rule is broken.

There is also a mechanism to indicate a message key to use for any validation failure for which we don't have more
specific information.  In the above examples, failing to include a `name` element will result in a general validation
error message being displayed.  If no `errors` information is provided for a given element, this package provides
default messages for each type of rule which are used instead of the raw output from the underlying validator (see
below).

The `enumLabels` element is specifically designed to allow internationalising the text displayed for things like radio
groups or drop-down lists.  Using the above message bundle and FSS Schema, we might generate a drop-down list to input a
`badgeColor` that looks something like:

```html
<select name="badgeColor">
    <option value="#ff0000">Red</option>
    <option value="#00ff00">Green</option>
    <option value="#0000ff">Blue</option>
</select>
```

## Validator

Although we use a particular industry standard JSON Schema validator ([AJV](https://github.com/epoberezkin/ajv)), the
validation functions provided in this package standardise validation errors to conform to our own independent format, as
shown here:

```json

{
    "isValid": false,
    "errors": [
        {
            "dataPath": ["requiredField"],
            "schemaPath": ["properties", "requiredField", "required"],
            "rule": { "required": true },
            "message": "fluid.schema.messages.validationErrors.required"
        },
        {
            "dataPath": ["deep", "booleanField"],
            "schemaPath": ["properties", "deep", "properties", "booleanField", "type"],
            "rule": { "type": "boolean" },
            "message": "fluid.schema.messages.validationErrors.type"
        }
    ]
}
```

The two top level elements are:

* `isError`: A boolean indicating whether or not there were validation errors.
* `errors`: An array containing individual errors (see below).

An individual error contains the following:

* `dataPath`: EL Path segments to the content which breaks a validation rule, relative to the object being
  validated.  Intended for use with functions like `fluid.get`, which can accept an array of EL path segments.
* `schemaPath`: EL Path segments to the rule which was violated by the content.
* `rule`: The rule that was violated.
* `message`: The i18n key for the validation error.

Although you may supply i18n messages that follow whatever conventions you choose, the default validation error messages
included with this package support the use of variables that come from the error. Continuing the above example, let's
look at how the second failure might be used with an i18n message template.  That error looks like:

```javascript
// This would ordinarily be delivered by the validator, but is presented here in isolation for illustration purposes.
var error = {
    "dataPath": ["deep", "booleanField"],
    "schemaPath": ["properties", "deep", "properties", "booleanField", "type"],
    "rule": { "type": "boolean" },
    "message": "fluid.schema.messages.validationErrors.type"
};

// This is simplified for illustration purposes, this would nearly always be delivered as part of a more complex bundle.
var messages = {
    "fluid.schema.messages.validationErrors.type": "The value supplied should be a(n) %rule.type."
};

var message = fluid.stringTemplate(messages[error.message], error); // The value supplied should be a(n) boolean.
```

## Schema-validated components

This package provides two "schema-validated" component grades.

1. A "schema-validated" component that ensures that the component's structure (and options) conform to a specified
   schema, and another to ensure that model values in the component conform to a specified schema.  For more
   information, see the [schema-validated component documentation](schemaValidatedComponent.md).
2. A "schema-validated model" component, where changes to the model are validated against a specified schema.  For more
   information, see the [schema-validated model component documentation](schemaValidatedModelComponent.md).

## Reusing material within an FSS schema.

The underlying JSON Schema draft standard provides a `$ref` operator that allow material to be reused, as shown here:

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "description": "Simple email schema.",
    "definitions": {
        "ourEmails": {
            "type": "string",
            "format": "email",
            "pattern": "^.+@ourdomain.com$"
        }
    },
    "properties": {
        "to":   { "$ref": "#/definitions/ourEmails" },
        "from": { "$ref": "#/definitions/ourEmails" },
        "subject": { "type": "string" },
        "body": { "type": "string" }
    }
}
```

This allows us to only define a rule once and reuse it in multiple places.  Infusion provides a handful of mechanisms
that can be used instead, namely:

1. [options merging](https://docs.fluidproject.org/infusion/development/OptionsMerging.html)
2. [options distribution](https://docs.fluidproject.org/infusion/development/IoCSS.html)
3. [IoC references](https://docs.fluidproject.org/infusion/development/IoCReferences.html)

The above example might be represented in FSS as follows:

```javascript
fluid.defaults("my.email.grade", {
    gradeName: ["fluid.schema.component"],
    schema: {
        "$schema": "fss-v7-full#",
        "description": "Simple email schema.",
        "definitions": {
            "ourEmails": {
                "type": "string",
                "format": "email",
                "pattern": "^.+@ourdomain.com$"
            }
        },
        "properties": {
            "to":   "{my.email.grade}.options.schema.definitions.ourEmails",
            "from": "{my.email.grade}.options.schema.definitions.ourEmails",
            "subject": { "type": "string" },
            "body": { "type": "string" }
        }
    }
});
```

Using the `$ref` operator, it's possible to create circular definitions, in which an object can contain a sub-element
that is validated according to the same schema, as shown here:

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "description": "Simple user schema.",
    "properties": {
        "firstName": { "type": "string" },
        "lastName": { "type": "string" },
        "friends": {
            "type": "array",
            "items": { "$ref": "#" }
        }
    }
}
```

This type of recursive structure is not currently supported in FSS.
