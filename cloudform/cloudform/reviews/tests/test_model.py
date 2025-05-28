from django.test import TestCase
from cloudform.users.models import User
from django.utils import timezone
from cloudform.reviews.models import Reviewer, Review
from cloudform.tickets.models import Ticket
from datetime import datetime
import pytz


class ReviewerModelTest(TestCase):
    def test_model_reviewer_have_fields(self):
        reviewer = Reviewer.__dict__
        self.assertTrue('user' in reviewer)
        
    def test_is_should_cretae_reviewer(self):
        user = User.objects.create(
            username='test-user'
        )
        
        revewer = Reviewer.objects.create(
            user=user
        )
        
        self.assertEqual(revewer.user, user)
        
    def test_is_should_return__str__by_user_username(self):
        username = 'user-keng'
        user = User.objects.create(
            username=username
        )
        
        revewer = Reviewer.objects.create(
            user=user
        )
        
        self.assertEqual(revewer.user, user)
        self.assertEqual(revewer.__str__(), username)
        
class ReviewModelTest(TestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "tickets",
        "reviewer",
        "reviews"
    ]
    
    def test_model_review_have_fields(self):
        review = Review.__dict__
        
        self.assertTrue('reviewer' in review)
        self.assertTrue('ticket' in review)
        self.assertTrue('note' in review)
        self.assertTrue('is_reviewed' in review)
        self.assertTrue('is_reject' in review)
        self.assertTrue('requested_at' in review)
        self.assertTrue('reviewed_at' in review)
        
    def test_is_should_crate_model_(self):
        reviewer = Reviewer.objects.get(pk=101)
        ticket = Ticket.objects.get(pk=1)
        note = 'test-note'
        is_reviewed = False
        is_reject = False
        requested_at = timezone.now()
        reviewed_at = timezone.now()
        
        review = Review.objects.create(
            reviewer=reviewer,
            ticket=ticket,
            note=note,
            is_reviewed=is_reviewed,
            is_reject=is_reject,
            requested_at=requested_at,
            reviewed_at=reviewed_at,
        )
        
        self.assertEqual(review.reviewer, reviewer)
        self.assertEqual(review.ticket, ticket)
        self.assertEqual(review.note, note)
        self.assertEqual(review.is_reviewed, is_reviewed)
        self.assertEqual(review.is_reject, is_reject)
        self.assertGreaterEqual(review.requested_at, requested_at)
        self.assertGreaterEqual(review.reviewed_at, reviewed_at)
        
    def test_is_should_create_for_ticket(self):
        ticket = Ticket.objects.get(pk=31)
        before_call = timezone.now()
        
        review = Review.create_for_ticket(ticket)
        
        self.assertEqual(review.ticket.id, ticket.id)
        self.assertEqual(review.is_reviewed, False)
        self.assertGreaterEqual(review.requested_at, before_call)
        
    def test_is_should_not_create_new_record_when_have_ticket_id_not_reviewed(self):
        ticket = Ticket.objects.get(pk=34)
        
        review = Review.create_for_ticket(ticket)
        
        self.assertEqual(review[0].ticket.status, 'created')
        self.assertEqual(review.__len__(), 1)
        self.assertEqual(review[0].ticket.id, ticket.id)
        self.assertEqual(review[0].is_reviewed, False)
        self.assertEqual(review[0].requested_at, datetime(2019, 9, 9, 4, 00, 26, 548737).replace(tzinfo=pytz.utc))
    
    def test_is_should_create_new_record_when_have_ticket_status_commented(self):
        ticket = Ticket.objects.get(pk=35)
        
        review = Review.create_for_ticket(ticket)
        
        self.assertEqual(review.ticket.status, 'feedback_applied')
        review_specifi = Review.objects.filter(ticket__id=35)
        self.assertEqual(review_specifi.__len__(), 2)
