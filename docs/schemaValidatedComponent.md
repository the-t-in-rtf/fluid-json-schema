# `fluid.schema.component`

A "schema validated component" is one whose structure (including all options) is validated against a specified schema as
part of its creation lifecycle.  Validation occurs immediately after options merging and expansion, but before the
component is created.  If there are validation errors, the component will not be created, and `fluid.fail` will be
called with the error.

## Component Options

| Option   | Type     | Description |
| -------- | -------- | ----------- |
| `schema` | `Object` | One or more rules defined using [FSS](fss.md). The merged `schema` option will be used to validate the component on startup. |

### The `schema` option

The base grade includes rules that define the standard contract for a Fluid component, including things like
[invokers](https://docs.fluidproject.org/infusion/development/Invokers.html),
[events, and listeners](https://docs.fluidproject.org/infusion/development/InfusionEventSystem.html).  Rules are
provided for the options used with
[View Components](https://docs.fluidproject.org/infusion/development/tutorial-developerIntroduction/DeveloperIntroductionToInfusionFramework-ViewsAndViewComponents.html)
as well.

To add your own fields or change the rules used to validated existing fields, you can use one or more of the following
Infusion framework features:

1. [options merging](https://docs.fluidproject.org/infusion/development/OptionsMerging.html)
2. [IoC references](https://docs.fluidproject.org/infusion/development/IoCReferences.html)
3. [options distribution](https://docs.fluidproject.org/infusion/development/IoCSS.html)

#### Adding material to the `schema` option.

Let's start with the most basic use case, defining additional options that are allowed.

```javascript
fluid.defaults("my.email.baseGrade", {
    gradeName: ["fluid.schema.component"],
    schema: {
        "description": "Simple email schema.",
        "properties": {
            "options": {
                "to":   { "type": "string", "format": "email", "required": true },
                "from": { "type": "string", "format": "email", "required": true },
                "subject": { "type": "string", "required": true },
                "body": { "type": "string", "required": true }
            }
        }
    }
});
```

Without changing any of the existing rules regarding allowed options, this adds four required options that each instance
of this component must provide in order to start up successfully.

#### Reusing complex definitions between fields.

When adding simple rules, options merging as demonstrated above is perfectly adequate.  When rules become complex, we
may wish to reuse material in multiple places.  Let's say we want to extend the above grade to only allow internal
emails, i.e. mails between two users in our own domain.

```javascript
fluid.defaults("my.email.internalOnly", {
    gradeName: ["my.email.baseGrade"],
    schema: {
        "description": "Internal email schema.",
        "definitions": {
            "ourEmails": {
                "pattern": "^.+@ourdomain.com$"
            }
        },
        "properties": {
            "options": {
                "to":   "{my.email.internalOnly}.options.schema.definitions.ourEmails",
                "from": "{my.email.internalOnly}.options.schema.definitions.ourEmails"
            }
        }
    }
});
```

Note that the `type` and `format` from the base grade are inherited and do not need to be defined again.  The effective
merged schema (for purposes of illustration, not including material inherited from `fluid.schema.component`) now looks
something like:

```json
{
    "description": "Internal email schema.",
    "definitions": {
        "ourEmails": {
            "pattern": "^.+@ourdomain.com$"
        }
    },
    "properties": {
        "options": {
            "to":   { "type": "string", "format": "email", "required": true, "pattern": "^.+@ourdomain.com$" },
            "from": { "type": "string", "format": "email", "required": true, "pattern": "^.+@ourdomain.com$" },
            "subject": { "type": "string", "required": true },
            "body": { "type": "string", "required": true }
        }
    }
}
```

#### Removing material from the `schema` option.

Say for example you have defined a component that includes a number expressed as an integer:

```javascript
fluid.defaults("my.irrevocable.restriction", {
    gradeNames: ["fluid.schema.component"],
    schema: {
        properties: {
            options: {
                frequency: {
                    type: "number",
                    multipleOf: 1
                }
            }
        }
    }
});
```

What if you now want to make a grade that allows more precision, i.e. non-integers?  You can of course change the value
of `multipleOf` to some incredibly small decimal value (`multipleOf: 0000000000.1`, for example), but how can we
remove the restriction altogether?

Currently, removal of material from a schema is difficult.  Instead, you are encouraged to create "base" grades that
lack problematic material and to extend those in your implementation grades, as shown here:

```javascript
fluid.defaults("my.safe.baseGrade", {
    gradeNames: ["fluid.schema.component"],
    schema: {
        properties: {
            options: {
                frequency: {
                    type: "number"
                }
            }
        }
    }
});

fluid.defaults("my.irrevocable.restriction", {
    gradeNames: ["my.safe.baseGrade"],
    schema: {
        properties: {
            options: {
                frequency: {
                    multipleOf: 1
                }
            }
        }
    }
});
```

This allows others to extend your work without inheriting the restriction.  There are currently discussions around
improving this by adding the concept of [a "local merge policy"](issues.fluidproject.org/browse/FLUID-5668).
