from cloudform.user_domain import ldap
from cloudform.user_domain.models import UserDomain


def search(domain_or_name, user):
    if isinstance(domain_or_name, str):
        domain = UserDomain.objects.filter(name=domain_or_name).first()
    else:
        domain = domain_or_name

    search_result = ldap.search(user, domain)
    data = [dict(zip(("user_dn", "attributes"), rec)) for rec in search_result]

    return data

def search_reviewer(domain_or_name, user):
    if isinstance(domain_or_name, str):
        domain = UserDomain.objects.filter(name=domain_or_name).first()
    else:
        domain = domain_or_name

    search_result = ldap.search_reviewer(user, domain)
    data = [dict(zip(("user_dn", "attributes"), rec)) for rec in search_result]

    return data
