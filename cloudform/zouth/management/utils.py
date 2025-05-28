import fileinput
import os
import re
import sys


def clean_module_name(module_name):
    return module_name.rstrip(os.sep).replace(os.sep, ".")


def replace_string_in_file(filename, old_name, new_name):
    for line in fileinput.input(filename, inplace=True):
        sys.stdout.write(line.replace(old_name, new_name))


# to be implement
def generate_migrations_file(old_name, new_name):
    print(
        f"generate migration file for rename table prefix from {old_name} to {new_name}"
    )
    print("TODO: you need to execute sql to update django migration table manually.")
    print("RUN SQL STATEMENT BELOW FOR UPDATE DJANGO MIGRATION TABLE")
    print(f"update django_migrations set app='{old_name}' where app='{new_name}';")
    print("\n\nTODO: you should to create migration file for rename table.")
    print(f"python manage.py makemigrations --empty {new_name}")
    print("EDIT THE MIGRATION FILE")
    print(
        """
    operations = [
        migrations.RunSQL(
            "ALTER TABLE IF EXISTS {old_name}_modelname1 RENAME TO {new_name}_modelname1;"
        ),
        migrations.RunSQL(
            "ALTER TABLE IF EXISTS {old_name}_modelname2 RENAME TO {new_name}_modelname2;"
        ),
    ]
        """
    )


def handle_migrations_file(filename, old_name, new_name):
    simple_old_name = to_table_prefix(old_name)
    simple_new_name = to_table_prefix(new_name)
    if simple_old_name == simple_new_name:
        return
    for line in fileinput.input(filename, inplace=True):
        _line = re.sub(
            f"(\\(|to=)(['\"]){simple_old_name}", f"\\1\\2{simple_new_name}", line
        )
        sys.stdout.write(_line)

    # generate_migrations_file(simple_old_name, simple_new_name)


def reimport_module(filename, old_name, new_name):
    for line in fileinput.input(filename, inplace=True):
        _line = re.sub(f"(import|from) ({old_name})(.*)", f"\\1 {new_name}\\3", line)
        sys.stdout.write(_line)


def handle_urls_file(filename, old_name, new_name):
    for line in fileinput.input(filename, inplace=True):
        _line = re.sub(
            f"include\\(['\"]{old_name}.urls['\"]\\)",
            f'include("{new_name}.urls")',
            line,
        )
        sys.stdout.write(_line)
    reimport_module(filename, old_name, new_name)


def to_table_prefix(module_name):
    return module_name.split(".")[-1]


def handle_rename_module(filename, old_name, new_name):
    if filename.endswith("settings.py"):
        # BUG: it simply replace text, (DATABASE_NAME or HOST will rename when match with old_name)
        replace_string_in_file(filename, old_name, new_name)
    elif filename.endswith("urls.py"):
        handle_urls_file(filename, old_name, new_name)
    elif "migrations" in filename:
        handle_migrations_file(filename, old_name, new_name)
    else:
        reimport_module(filename, old_name, new_name)
