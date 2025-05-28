import glob
import os
import shutil

from django.core.management.base import BaseCommand

from zouth.management.utils import (
    clean_module_name,
    handle_rename_module,
    to_table_prefix,
    replace_string_in_file,
)


def move_module(src, dst):
    src_dir = src.replace(".", os.sep)
    dst_dir = "." if dst == "." else dst.replace(".", os.sep)

    if dst.startswith(src):
        *dst_dir_parent, dst_dir_child = dst_dir.split(os.sep)
        dst_dir_parent = os.sep.join(dst_dir_parent)
        print(f"move {src_dir} to {dst_dir_child}")
        shutil.move(src_dir, dst_dir_child)
        print(f"makedirs {dst_dir_parent}")
        os.makedirs(dst_dir_parent, exist_ok=True)
        print(f"move {dst_dir_child} to {dst_dir_parent}")
        shutil.move(dst_dir_child, dst_dir_parent)
        with open(f"{src}/__init__.py", "w+"):
            pass
    else:
        shutil.move(src_dir, dst_dir)


class Command(BaseCommand):
    help = "rename and reimport with new module name."

    def add_arguments(self, parser):
        parser.add_argument("src", type=str)
        parser.add_argument("dst", type=str)

    def handle(self, *args, **kwargs):
        src = clean_module_name(kwargs.get("src"))
        dst = clean_module_name(kwargs.get("dst"))
        print(f"src={src} dst={dst}")
        move_module(src, dst)

        old_name = src
        new_name = f"{dst}.{src}"
        if dst == ".":
            new_name = src.split(".")[-1]
        elif dst.startswith(src):
            new_name = dst

        for filename in glob.glob("**/*.py", recursive=True):
            handle_rename_module(filename, old_name, new_name)

        for filename in glob.glob("**/fixtures/*.yaml", recursive=True):
            replace_string_in_file(
                filename, to_table_prefix(old_name), to_table_prefix(new_name)
            )

