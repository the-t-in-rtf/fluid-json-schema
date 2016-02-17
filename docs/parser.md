
# What is the parser?

The parser component provided by this package is designed to make it easier to understand an existing JSON Schema, and
to make it easier to provide clear feedback to end users.

[JSON Schema](http://json-schema.org/) is a standard for describing JSON data formats using JSON notation.  Simple
schemas are more or less human-readable descriptions of what structure is expected and what data is allowed at each
level.

You can reuse content within or between schemas using the `$ref` notation, which allows you to refer to content found
elsewhere.  Schemas that make use of the `$ref` notation are not generally human readable, especially when there is a
chain of inherited definitions that must each be retrieved and understood before you reach the level of "simple" rules.

This component parses a JSON Schema and dereferences all of its `$ref` links (including chains of references).  The
final result is a JSON Schema that enforces the same structure as the original, but which is composed only of "simple"
rules.

# What is it used for?

The parser can be used to present a simplified (dereferenced schema) and to interrogate that schema for details about
a given field.  Our first use case for both of these things is adding partial support for custom error messages as
outlined in [draft v5 of the JSON Schema standard](https://github.com/json-schema/json-schema/wiki/Custom-error-messages-(v5-proposal)).

# The v5 proposal

The draft v5 standard adds an `errors` keyword, which is a map of relative JSON pointers and replacement message
definitions.  It can be used either the document level, or when defining an individual field.  Here is an example of
using `errors` at the document level, taken from the v5 draft proposal:

```
{
  "properties": {
    "age": { "minimum": 13 },
    "gender": { "enum": ["male", "female"] }
  },
  "errors": {
    "#/properties/age/minimum": "Should be at least ${schema} years, ${data} years is too young.",
    "#/properties/gender/enum": {
      "text": "Gender should be ${schema/0} or ${schema/1}",
      "action": "replace"
    }
  }
}
```

Here is an example of using `errors` within an individual field, again taken from the v5 draft proposal:

```
{
  "properties": {
    "age": {
      "minimum": 13,
      "errors": {
        "minimum": "Should be at least ${schema} years, ${data} years is too young."
      }
    },
    "gender": {
      "enum": ["male", "female"],
      "errors": {
        "enum": {
          "text": "Gender should be ${schema/0} or ${schema/1}",
          "action": "replace"
        }
      }
    }
  }
}
```

## So what does the new field actually _do_?

Let's say that we have the following schema:

```
{
  "properties": {
    "field": {
      "type": "string",
      "pattern": "[A-Z]+"
    }
  }
}
```

If we were to validate the simply JSON document `{ "field": "lowercase" }`, the validator would return output like:

```
[
  {
    "keyword": "pattern",
    "dataPath": ".field",
    "schemaPath": "#/properties/field/pattern",
    "params": {
      "pattern": "^[A-Z]+$"
    },
    "message": "should match pattern \"^[A-Z]+$\""
  }
]
```

Here's the same schema with the v5 error definition added.

```
{
  "properties": {
    "field": {
      "type": "string",
      "pattern": "^[A-Z]+$",
      "errors": {
        "pattern": "You must enter an uppercase string."
      }
    }
  }
}
```

Now the validator (with our help) can return the following output:

```
[
  {
    "keyword": "pattern",
    "dataPath": ".field",
    "schemaPath": "#/properties/field/pattern",
    "params": {
      "pattern": "^[A-Z]+$"
    },
    "message": "You must enter an uppercase string."
  }
]
```

## Differences from the draft v5 proposal

## No support for variables

The draft v5 proposal promises support for using schema variables and user data in the text of an error message. This
module does not support this.  As such, we also  do not support the longer form of the message definition (where the
error is an object that contains a `text` and `action`).  Instead, we support only the simplest of the forms outlined
above, as in this updated snippet:

```
"age": {
  "minimum": 13,
  "errors": {
    "minimum": "Should be at least 13 years."
  }
},
```

The working draft is not clear on how "required" fields should be evolved to use custom errors.  This module uses
the schema proposed [in this GitHub issue](https://github.com/json-schema/json-schema/issues/222).  Here is an example
of how this module expects `errors` data to be entered for required fields:

```
{
  "properties": {
    "shallowlyRequired": {
      "type": "string",
      "properties": {
        "deeplyRequired": { "type": "string" }
      },
      "required": ["deeplyRequired"],
      "errors": {
        "required/0": "This field is required and I'm telling you about it from within a field definition."
      }
    }
  },
  "required": ["shallowlyRequired"],
  "errors": {
    "required/0": "This field is required and I'll tell you about it at the document level.",
    "shallowlyRequired/required/0": "This deep field is required."
  }
}
```

Note that all of the "keys" used in an `errors` block are [relative JSON Pointers](https://tools.ietf.org/html/rfc6901).
Slashes within keys should be escaped as `~1`.  Tildes within keys should be escaped as `~0`.

# Requirements

To use this component, you will need to instantiate it and make it aware of your schemas.  These will be dereferenced
and cached as they are added.  You can then use the `evolveError` method to resolve the custom error definition for a
field using the schema key and the field's JSON pointer.  See the validator implementation for an example of its use.

This component uses [json-schema-ref-parser](https://github.com/BigstickCarpet/json-schema-ref-parser).  We configure
it using `options.parserOptions` (empty by default).  Read the library's documentation for details of [what options
are available](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/master/docs/options.md).

Note that this library expects to be able to resolve external references relative to the first argument passed to its
`dereference` function, and it expects to load and cache the references itself as needed.  Since we are receiving keys
from the `validator`, we need to some how convert these to URLs.  We do this using `fluid.stringTemplate` to combine
`options.schemaPath` with the individual key, which means:

1.  If `options.schemaPath` is a directory location, a full path will be produced.
2.  If `options.schemaPath` is a URL, a full URL will be produced.
3.  If `options.schemaPath` is empty, paths will be resolved relative to the working directory.

# Components

## `gpii.schema.parser`

The base component is designed to work both on the client and server side.

## `gpii.schema.parser.server`

A server-side version of the component which can handle package-relative `schemaPath` entries like `%gpii-package-name/path/within/package`.

# Component Options

The following component configuration options are supported:

|      Option        |   Type   | Description |
| ------------------ | -------- | ----------- |
| `schemaPath`       | `String` or `Array` | The location of the directory or directories containing all schemas used by the parser.   Each entry should be a package-relative path such as `%gpii-handlebars/tests/schemas`.|

# Invokers

The `parser` component provides the following invokers:

## `{parser}.dereferenceSchema(schemaPath, schemaKey)`

 * `schemaPath {String}`:  A path (server side )or URI (client side) to the directory or base URL where the schema can be found.  Will be combined with `schemaKey` to construct the full location of the schema.
 * `schemaKey {String}`: The filename of the schema relative to `schemaPath`.
 * Returns: A `promise` that will be satisfied when the parser finishes its work.  The promise itself does not return any value.

 Dereference a single schema.  As the process is asynchronous, this function returns a promise.  Typically accessed
 using the parser component's `dereferenceSchema` invoker and the `schemaKey` attribute.

## `{parser}.evolveError(schemaKey, error)`

* `schemaKey {String}`: The `key` of the schema (generally the filename, i.e. `base.json`).
* `error {object}`: The original error returned by AJV.
* Returns: `Object` The "evolved" error with an updated message based on the `errors` definitions (if there are any).

This function used by the validator to transform the full set of raw validation results using `fluid.transform`.  It
tries to look up the v5 draft proposal `errors` definition for a given `error`.  A copy of the original `error` is
returned, with an updated `error.message` if a custom error definition was found.

The parser starts by looking for the relevant error definition in the document, i.e. at `#/errors`.  If that fails, look
for a relevant definition at the field.  This involves navigating from the failing rule to the relevant `errors` block.
There are two variations:

1. All required data has been entered but a field is invalid.  In those cases, `schemaPath` is something like
   `#/properties/password/allOf/1/pattern` and the relevant `errors` block is something like
   `#/properties/password/allOf/1/errors/pattern`.

2. Required data is missing.  In those cases, `schemaPath` is something like `#/properties/deep/required`
   or `#/required` and the relevant `errors` block is something like `#/properties/deep/errors` or
   `#/errors`.  The `errors` block should contain an entry for the field based on its position in the 
   `required` array, as in `/required/0`, `/required/1`, et cetera.

In both cases we navigate to the parent element immediately above the reported failure, and then to its `errors`
block.  If we find an error definition that matches the failure, we add that to a modified copy of the error and return
that.
