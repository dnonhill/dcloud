from django.test import TestCase
from django.db import IntegrityError
from zouth.sequence.models import Sequence

from django.conf import settings

# Create your tests here.


class TestSequenceModel(TestCase):
    def test_unique_sequence_by_name_and_prefix(self):
        try:
            seq1 = Sequence(name="seq name", prefix="YYYYMMDD", running=1)
            seq1.save()

            seq2 = Sequence(name="seq name", prefix="YYYYMMDD", running=2)
            seq2.save()

            assert False, "sequence cannot duplicate"
        except IntegrityError as error:
            error_message = str(error.__cause__)
            assert "violates unique constraint" in error_message, error_message

    def test_next_sequence(self):
        expected = settings.ZOUTH_SEQUENCE_INITIAL
        result = Sequence.next("seq name", prefix="YYYYMMDD")
        assert result == expected, f"{result} must equal {expected} "

        expected = settings.ZOUTH_SEQUENCE_INITIAL + 1
        result = Sequence.next("seq name", prefix="YYYYMMDD")
        assert result == expected, f"{result} must equal {expected} "
