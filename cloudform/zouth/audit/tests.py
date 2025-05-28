from django.db import models, connection
from django.contrib.auth import get_user_model
from django.test import TestCase


from django.utils import timezone

from zouth.audit.models import AuditModel
from zouth.audit.serializers import AuditModelSerializer


class SimpleAuditModel(AuditModel):
    name = models.CharField(max_length=20)

    class Meta:
        app_label = "myappname"


User = get_user_model()


class AuditTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super(AuditTestCase, cls).setUpClass()
        cls.user = User.objects.create_user(username="testuser")

        # Create the schema for our test model
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(SimpleAuditModel)

    def tearDown(self):
        # Delete the schema for the test model
        # with connection.schema_editor() as schema_editor:
        #     schema_editor.delete_model(self.model)
        pass

    def test_created_at(self):
        before_create_time = timezone.now()
        audited_object = SimpleAuditModel.objects.create(
            created_by=self.user, updated_by=self.user
        )
        after_create_time = timezone.now()

        self.assertGreater(audited_object.created_at, before_create_time)
        self.assertLess(audited_object.created_at, after_create_time)

    def test_updated_at(self):
        audited_object = SimpleAuditModel.objects.create(
            created_by=self.user, updated_by=self.user
        )
        updated_at = audited_object.updated_at

        audited_object.name = "test updated at"
        audited_object.save()

        self.assertGreater(audited_object.updated_at, updated_at)

    def test_created_by(self):
        audited_object = SimpleAuditModel.objects.create(
            created_by=self.user, updated_by=self.user
        )

        self.assertEqual(audited_object.created_by, self.user)


class SimpleAuditModelSerializer(AuditModelSerializer):
    class Meta:
        model = SimpleAuditModel
        fields = "__all__"


class MockAuthenticatedRequest:
    user = None

    def __init__(self, user):
        self.user = user


class AuditModelSerializerTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super(AuditModelSerializerTestCase, cls).setUpClass()
        cls.user1 = User.objects.create_user(username="user1", password="testpassword")
        cls.user2 = User.objects.create_user(username="user2", password="testpassword")

        # Create the schema for our test model
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(SimpleAuditModel)

    def test_initial_audit_fields(self):
        serializer_on_create = SimpleAuditModelSerializer(
            data={"name": "roong"},
            context={"request": MockAuthenticatedRequest(self.user1)},
        )
        serializer_on_create.is_valid(raise_exception=True)
        created = serializer_on_create.create(serializer_on_create.validated_data)

        self.assertEqual(created.created_by, self.user1)
        self.assertEqual(created.updated_by, self.user1)

        serializer_on_update = SimpleAuditModelSerializer(
            data={"name": "pitsanu"},
            context={"request": MockAuthenticatedRequest(self.user2)},
        )
        serializer_on_update.is_valid(raise_exception=True)
        updated = serializer_on_update.update(created, serializer_on_update.validated_data)
        self.assertEqual(updated.created_by, self.user1)
        self.assertEqual(updated.updated_by, self.user2)

    def test_cannot_directly_set_created_by_and_updated_by(self):
        serializer = SimpleAuditModelSerializer(
            # set created_by, updated_by by data
            data={"name": "roong", "created_by": 1, "updated_by": 1},
            context={"request": MockAuthenticatedRequest(self.user2)},
        )
        serializer.is_valid(raise_exception=True)
        obj = serializer.create(serializer.validated_data)

        self.assertEqual(obj.created_by, self.user2)
        self.assertEqual(obj.updated_by, self.user2)
