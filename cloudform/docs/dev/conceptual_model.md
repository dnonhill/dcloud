# Conceptual Model

## Resources
```puml
class Project {
  jobCode
}
class Application
class Resource {
  name - unique within project
  type
  status
}
class ResourceAttribute <<JSON Serialized>>
class IaaSAttribute
class PaaSAttribute

Project "1" *- "*" Application
Application "1" *- "*" Resource
Resource "1" -- "1" ResourceAttribute :define

ResourceAttribute <|-- IaaSAttribute
ResourceAttribute <|-- PaaSAttribute
```
### Glossary
| **Applcation** | Logical group of resources i.e. PoS Backend |

## Request Form
```puml
class Request
class RequestItem {
  action: [create, modify, destroy]
}
class ResourceSpec

class Resource
Request *- RequestItem
RequestItem *- ResourceSpec
ResourceSpec - Resource :define
Request "*" --* "1" Project
RequestItem -- Application
```

## Approval
```puml
class Request {
  approver: Approver
}

class Approver extends User
class RequestApproval {
  reason: text
}

Approver - Request
RequestApproval .. (Approver, Request)
```

## Task execution
```puml
class Request
class RequestItem

Request *-- RequestItem

CloudAdmin - Operator : assign to
TaskAssigment .. (CloudAdmin, Operator)
TaskAssigment - Request : assign

TaskAssigment *- TaskSet
note left of TaskSet
Generate TaskSet
on Assign
endnote
RequestItem -- TaskSet
TaskSet *- TaskItem

TaskSet -- TaskSetTemplate : generates items from template

TaskItem -- TaskItemResult
TaskItem <|-- RunScriptTask
TaskItem <|-- ManualTask
TaskSet -- TaskSetResult
```
