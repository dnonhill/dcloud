from django.test import TestCase
from hamcrest import assert_that, has_items, equal_to, has_entries, is_

from .webhooks import WebHookTaskResultFilter


class WebHookTaskResultFilterTest(TestCase):
    def setUp(self):
        self.task = None
        self.filter = WebHookTaskResultFilter(self.task)
        self.task_result = {
            "plays": [
                {
                    "name": "playbook1",
                    "tasks": [
                        {
                            "role": "role1",
                            "name": "task 1",
                            "results": [{"status": "ok", "content": {"a": 1, "b": 2}}],
                        },
                        {
                            "role": "",
                            "name": "result",
                            "results": [{"status": "ok", "content": {"a": 3, "b": 4}}],
                        },
                        {
                            "role": "role1",
                            "name": "task 2",
                            "results": [{"status": "ok", "content": {"a": 5, "b": 6}}],
                        },
                        {
                            "role": "",
                            "name": "result",
                            "results": [{"status": "ok", "content": {"c": 7, "d": 8}}],
                        },
                    ],
                }
            ]
        }

    def test_extract_vars(self):
        self.task_result = self.filter._extract(self.task_result)

        assert_that(self.task_result, has_items({"a": 3, "b": 4}, {"c": 7, "d": 8}))

    def test_filter_vars(self):
        self.task_result = [{"a": 3, "b": 4}, {"c": 7, "d": 8}]
        self.task_result = self.filter._collapse(self.task_result)

        assert_that(self.task_result, has_entries({"a": 3, "b": 4, "d": 8, "c": 7}))

    def test_select_vars(self):
        original_task_result = {"a": 3, "b": 4, "c": 7, "d": 8}

        self.task_result = self.filter._select(original_task_result)

        assert_that(self.task_result, is_(equal_to(original_task_result)))
