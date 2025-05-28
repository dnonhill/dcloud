from psycopg2.extensions import AsIs, register_adapter


def adapt_set(data):
    return AsIs("ARRAY " + str(list(data)))


register_adapter(set, adapt_set)


from .projects import ProjectViewSet
from .applications import ApplicationViewSet
from .resources import ResourceViewSet
