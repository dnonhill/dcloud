from typing import List, Dict

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from cloudform.projects.models import Project, Application, Resource, DataCenter
from cloudform.tasks.models import TaskTemplate, TaskGroup, Assignment
from cloudform.tickets.models import Ticket, TicketItem
from cloudform.users.models import Requestor


def make_data_center(name, **kwargs):
    attrs = kwargs.copy()

    _attr_set_pk(attrs, **kwargs)

    datacenter = DataCenter.objects.create(name=name, **attrs)

    return datacenter


def make_project(job_code, name, members=None, **kwargs):
    attrs = kwargs.copy()
    if "pk" in kwargs:
        attrs["id"] = kwargs["pk"]
        del attrs["pk"]

    project = Project.objects.create(job_code=job_code, name=name, **attrs)

    if members:
        for member in members:
            project.members.add(member)

    return project


def make_application(project_or_id, name, description, **kwargs):
    attrs = kwargs.copy()
    if "pk" in kwargs:
        attrs["id"] = kwargs["pk"]
        del attrs["pk"]

    if isinstance(project_or_id, int):
        attrs["project_id"] = project_or_id
    else:
        attrs["project"] = project_or_id

    application = Application.objects.create(
        name=name, description=description, **attrs
    )

    return application


def user_or_id_attributes(user_or_id):
    user_attributes = {}
    created_by_key, updated_by_key = "created_by", "updated_by"
    if isinstance(user_or_id, int):
        created_by_key += "_id"
        updated_by_key += "_id"
    user_attributes[created_by_key] = user_or_id
    user_attributes[updated_by_key] = user_or_id
    return user_attributes


def make_task_template(
    action: str, resource_type: str, user_or_id, templates: List[Dict]
) -> List[TaskTemplate]:
    audit_attributes = user_or_id_attributes(user_or_id)
    result = []
    for sequence, attributes in enumerate(templates):
        attributes.update(audit_attributes)
        template = TaskTemplate.objects.create(
            resource_type=resource_type,
            action=action,
            task_sequence=sequence,
            **attributes,
        )
        result.append(template)
    return result


def make_ticket(application_id, ticket_no, status, data_center_or_id=None, **kwargs):
    attrs = kwargs.copy()

    _attr_set_pk(attrs, **kwargs)
    _attr_obj_ref(attrs, "data_center", data_center_or_id)
    _attr_obj_ref(attrs, "created_by", Requestor.objects.first())

    ticket = Ticket.objects.create(
        application_id=application_id, ticket_no=ticket_no, status=status, **attrs
    )
    return ticket


def make_ticket_item(
    action, ticket, resource=None, resource_type=None, **kwargs
) -> TicketItem:
    attrs = kwargs.copy()

    _attr_set_pk(attrs, **kwargs)

    resource_type = resource_type or resource.resource_type
    ticket_item = TicketItem.objects.create(
        ticket=ticket,
        resource=resource,
        resource_type=resource_type,
        action=action,
        **attrs,
    )
    return ticket_item


def make_group(name, permissions=None, **kwargs):
    attrs = {}

    if "pk" in kwargs:
        attrs["id"] = kwargs["pk"]

    group = Group.objects.create(name=name, **attrs)

    if permissions:
        group.permissions.add(permissions)

    group.save()
    return group


def make_user(
    username, email=None, password=None, groups=None, user_permissions=None, **kwargs
):
    attrs = kwargs.copy()

    if "pk" in kwargs:
        attrs["id"] = kwargs["pk"]
        del attrs["pk"]

    user = get_user_model().objects.create_user(username, email, password, **attrs)

    if groups:
        for group in groups:
            user.groups.add(group)

    if user_permissions:
        for user_perm in user_permissions:
            user.user_permissions.add(user_perm)

    user.save()
    return user


def make_task_group(ticket_item, **kwargs):
    attrs = kwargs.copy()
    if "pk" in kwargs:
        attrs["id"] = kwargs["pk"]
        del attrs["pk"]

    return TaskGroup.objects.create(ticket_item=ticket_item, **attrs)


def _attr_set_pk(attrs, **kwargs):
    if "pk" in kwargs:
        attrs["id"] = kwargs["pk"]
        del attrs["pk"]


def _attr_obj_ref(attrs, key, value_or_id):
    attrs[key] = value_or_id
    if isinstance(value_or_id, int):
        attrs[key + "_id"] = value_or_id
        del attrs[key]


def make_assignment(ticket_or_id, assigner_or_id, assignee_or_id, **kwargs):
    attrs = kwargs.copy()

    _attr_set_pk(attrs, **kwargs)
    _attr_obj_ref(attrs, "ticket", ticket_or_id)
    _attr_obj_ref(attrs, "assigner", assigner_or_id)
    _attr_obj_ref(attrs, "assignee", assignee_or_id)

    assignment = Assignment.objects.create(**attrs)
    return assignment


def make_resource(application_or_id, name, resource_type, **kwargs):
    attrs = kwargs.copy()

    _attr_set_pk(attrs, **kwargs)
    _attr_obj_ref(attrs, "application", application_or_id)

    resource = Resource.objects.create(name=name, resource_type=resource_type, **attrs)
    return resource
