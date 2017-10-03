---
date: 2016-03-09T00:11:02+01:00
title: Key Concepts
weight: 10
---

## Blueprints

In Tymly, a "__blueprint__" describes related functionality that adds value to an organization.
Typically a blueprint will describe all the workflows, rules and forms affecting a business function or team - but they're equally suited to describing open data and ETL pipelines.

![Cartoon illustration of people looking inside a Blueprint](/images/inside-a-blueprint.png#center)

Blueprints equate to a directory containing a simple `blueprint.json` file and one-or-more sub-directories:

| Sub-directory | Description |
| ------------- | ----------- |
| `/functions` | Blueprints are predominantly declarative - preferring JSON definitions over hand-coded functions. But for those times when only code will do, blueprints can supply supplemental Javascript functions too. |
| `/registry-keys` | Consider a blueprint that defines a simple workflow that sends a Tweet - what Twitter username/password should be used? This is where _Registry Keys_ come in useful... a simple key/value store inside Tymly, where keys are declared inside this sub-directory. To help conjure administrative screens and help validation, the required value content is described using JSON Schema. |
| `/state-machines` | Each JSON file inside this sub-directory will be used to conjure a State Machine for orchestrating a workflow. Tymly uses the open [Amazon State Language](https://states-language.net/spec.html) to describe State Machines. |
| `/models` | This sub-directory deals with the `M` portion of `MVC` - each JSON file in here defines a data model that can be subsequently used by a State Machine. Nested documents are supported along with a couple of extensions to help describe database indexes and primary keys. Tymly uses the JSON Schema standard for describing data models. |
| `/tags` | JSON files providing &#39;tags&#39; which are used throughout Tymly to help categorise things and aid discovery |
| `/images` | A place to put images that can be served-up in Forms and similar |
| `/forms` | One JSON file per Form (currently need to be in [Schemaform](http://schemaform.io/) format) |
| `/search-docs` | Each JSON file is used to translates a model document into standard properties for searching. |

## State Machines

Everything that happens inside Tymly happens because a finite-[State Machine](https://en.wikipedia.org/wiki/Finite-state_machine) triggered it. If Tymly were to be considered in terms of Model, View, Controller... then State Machines are all about the _Controller_.
Tymly uses the open [Amazon States Specification](https://states-language.net/spec.html) to define State Machines inside blueprints - as such, the following State Machine constructs are supported:

<table >
    <tr>
        <th>Sequential</th>
        <th>Choice</th>
        <th>Parallel</th>
    </tr>
    <tr>
        <td><img src="/images/sequential-states.png"/></td>
        <td><img src="/images/choice-states.png"/></td>
        <td><img src="/images/parallel-states.png"></td>
    </tr>
<tr>
<td>
<pre style="margin:0; padding:1em;">
{
 "States": {
  "Load": {
   "Type": "Task",
   "Resource": "module:findingById",
   "InputPath": "$.key",
   "Next": "Form"
  },
  "Form": {
   "Type": "Task",
   "Resource": "module:formFilling",
   "ResultPath": "$.formData",
   "Next": "Save"
  },
  "Save": {
   "Type": "Task",
   "Resource": "module:upserting",
   "InputPath": "$.formData",
   "End": "True"
  }
 }
}
</pre>
</td>

<td>
<pre style="margin:0;padding:1em;">
{
 "States": {
  "ConsiderLanguage": {
   "Type": "Choice",
   "Choices": [
    {
     "Variable": "$.language",
     "StringEquals": "Spanish"
     "Next": "SpanishGreeting"
    }
   ],
   "Default": "EnglishGreeting"
  },
  "SpanishGreeting": {
   "Type": "Task",
   "Resource": "module:logging",
   "ResourceConfig": {
    "template": "Hola"
   },
   "End": "True"
  },
  "EnglishGreeting": {
   "Type": "Task",
   "Resource": "module:logging",
   "ResourceConfig": {
    "template": "Hello"
   },
   "End": "True"
  }
 }
}
</pre>
</td>

<td>
<pre style="margin:0;padding:1em;">
{
 "States": {
  "ParallelThings": {
   "Type": "Parallel",
   "Branches": [
    {
     "StartAt": "ProcessAvatar",
     "States": {
      "ProcessAvatar" : {
       "Type": "Task",
       "Resource": "module:crop"
       "End": true
      }
     }
    },
    {
     "StartAt": "CreateAccount",
     "States": {
      "CreateAccount" : {
       "Type": "Task",
       "Resource": "module:onboard"
       "End": true
      }
     }
    }
   ],
   "Next": "SendWelcomeEmail"
  },
  "SendWelcomeEmail": {
   "Type": "Task",
   "Resource": "module:sendEmail"
   "End": true
  }
 }
}
</pre>
</td>
</tr>
</table>

### The booking-someone-sick flow

The flow represented in the diagram below allows an Operator (or more accurately a _user_ who has been assigned the Operator _role_) to process the necessary housekeeping when someone phones-in sick.

![Simple state diagram for booking-someone-sick](/images/simple-flow.png)

- As described in the next section, each  circle in this diagram is known as a [State](#states). The _initial_ state requires the operator to capture details of the sickness by filling-in a quick form.

- Once the form has been completed, the flow advances to a state where an email is sent to the employee's manager.

- What state the flow moves to next is dependent on whether the absence will reduce staffing below some critical level. Either things are fine and the flow can move to the final state or the Operations Room will be alerted to a staffing shortfall.

- And to finish, the employee will have a new entry added to their sickness record.

<hr>

## States

Each of the circles in the previous diagram are known as __States__.  Each Tymly flow contains all the necessary information to assemble a [Finite State Machine] (https://en.wikipedia.org/wiki/State_diagram) (__FSM__), that being:

- A list of possible states (an FSM can be in exactly one of a finite number of states at any given time)

- How states are connected together (along with any conditions that are required)

- Which state the FSM should find itself in as it starts (i.e. the flow's _initial_ state)

TymlyJS provides a pool of different [State Classes](/reference/#list-of-state-classes), each state in a flow will be associated with a particular _State Class_. It's possible to deliver a good chunk of back-office functionality with surprisingly few State Classes.

__For a full list of states that are currently available out-of-the-box, please see the [list of core states](/reference/#list-of-state-classes).__

<hr>

## Tymlys

At this point it _might_  be useful to think of things in terms of a railway network...

{{< note title="Analogy alert!" >}}

- __Flows__ can be seen as the railway track - connecting states together in a very controlled way

- __States__ can be seen as the railway stations - they're reached by travelling around flows. Journeys start at the _initial_ state.

- __Tymlys__ therefore can be seen as trains as they move from state-to-state. A single flow can have any number of Tymlys making their way around it.

{{< /note >}}

Tymlys are always persisted as a simple document so that they can survive server restarts.
This is an example of what might be persisted for a Tymly travelling around the __booking-someone-sick__ flow from earlier:

``` JSON
{
    "_id" : "586e42ade923c119c4a4a85b",
    "createdAt" : "2017-01-05T12:57:17.701+0000",
    "userId" : "john.doe@tymlyjs.io",
    "status" : "running",
    "flowId" : "booking-someone-sick",
    "stateId" : "notifyingOperationsRoom",
    "stateEnterTime" : "2017-01-05T12:57:17.686+0000",
    "ctx" : {
        "formData" : {
            "employeeNumber": 372711,
            "likelyReturnDate": "2017-01-07T09:00:00.000+0000",
            "sicknessCode": "hangover"
        }
    }
}
```

The various properties in this example document are described in the table below:

Property         | Description
---------------- | ---------------------------------
`_id`            | Uniquely identifies a Tymly
`createdAt`      | When the Tymly was first instigated
`userId`         | If the Tymly was instigated by a human, then this is the userId of that person
`status`         | Always one of `starting`, `running`, `waitingForHumanInput` or `finished`
`flowId`         | Identifies which flow this Tymly is travelling around
`stateId`        | Indicates the state that this Tymly is currently in
`stateEnterTime` | The timestamp of when the Tymly entered its current state
`ctx`            | This is a simple key/value store that's unique to each Tymly. In analogy terms, this is a good place to store the speed of a train. This __context__ is available to all states to read-from/write-to as they require. In this way, inter-state communication is possible - but within context of each ~~train~~ Tymly.

<hr>

## Plugins

TymlyJS takes a batteries-included approach and hopefully ships with enough [State Resources](/reference/#list-of-state-resources) to cover-off most of the the duller business processes out there. To help try and keep things minimal and manageable Tymly employs a __plugin__ architecture.
A TymlyJS plugin extends the core framework with related State Classes (along with other internal components required to run them).

__Please see the [list of core plugins](/reference/#list-of-plugins) to get a feel for what plugins are all about__

TymlyJS's current library of state classes is certainly far from exhaustive and organisations will undoubtedly have specialist requirements of their own.
It's straightforward to write a new plugin for TymlyJS and add missing capabilities.





 
 