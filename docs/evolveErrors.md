# The `gpii.schema.errors.evolveError` static function.

The [draft v5 JSON Schema standard](https://github.com/json-schema/json-schema/wiki/Custom-error-messages-%28v5-proposal%29)
adds an `errors` keyword, which is a map of relative JSON pointers and replacement message definitions.  It can be used
either the document level, or when defining an individual field.  Here is an example of using `errors` at the document
level, taken from the v5 draft proposal:

```json
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

```json
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

```json
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

```json
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

```json
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

```json
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
function does not support this.  As such, we also  do not support the longer form of the message definition (where the
error is an object that contains a `text` and `action`).  Instead, we support only the simplest of the forms outlined
above, as in this updated snippet:

```snippet
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

```json
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

## The `errors` block and inheritance.

Although this has not yet been established in the standard or in AJV, we have chosen to resolve
`errors` in a way that will allow overlaying errors on an existing schema, as in the following
example:

```json
{
  "id": "person.json",
  "definitions": {
    "firstname": { "type": "string" },
    "lastname":  { "type": "string" }
  },
  "properties": {
    "firstname": { "$ref": "#/definitions/firstname" },
    "lastname":  { "$ref": "#/definitions/lastname" }
  }
}
```

Here is a schema with overlayed error messages in English:

```json
{
  "id": "person-en.json",
  "properties": {
    "firstname": { "$ref": "person.json#/definitions/firstname" },
    "lastname":  { "$ref": "person.json#/definitions/lastname" }
  },
  "errors": {
    "#/definitions/firstname/type": "The first name must be a string.",
    "#/definitions/lastname/type":  "The last name must be a string."
  }
}
```

If you're having trouble figuring out what key to use in the document's `errors` block, use the schema to validate a
document in which the rule has been broken, and look at the `schemaPath` variable in the raw validator output.

# `gpii.schema.errors.evolveError(schemaContent, error)`

* `schemaContent {Object}`: The derefrenced content of the schema, as produce by [the parser](parser.md).
* `error {object}`: The original error returned by AJV.
* Returns: `{Object}` The "evolved" error with an updated message based on the `errors` definitions (if there are any).

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