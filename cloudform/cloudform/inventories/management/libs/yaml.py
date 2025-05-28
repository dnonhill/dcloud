
import yaml
from django.core.management.base import CommandError


def read_yaml_param(file_name):
    try:
        with open(file_name, 'r') as file:
            data = yaml.safe_load(file)
            return data
    except FileNotFoundError:
        raise CommandError(f'File "{file_name}" does not exist')
    except yaml.YAMLError as e:
        raise CommandError(f'Error parsing YAML file: {e}')
