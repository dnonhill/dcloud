from django.utils import timezone
from rest_framework import status
from cloudform.login.tests.utils import AuthorizedUserRequiredTestCase
from cloudform.reviews.models import Review, Reviewer
from rest_framework import permissions, exceptions


class ReviweViewSetTest(AuthorizedUserRequiredTestCase):
    fixtures = [
        "groups",
        "users",
        "projects",
        "applications",
        "data-center",
        "data-center-level",
        "tickets",
        "reviewer",
        "reviews",
        "approvements",
        "approver",
    ]
    
    def test_approve(self):
        self._login_as("reviewer001")
        data = {"ticket_timestamp": "2019-08-06 03:06:33.584034+00:00"}
        before_call = timezone.now()
        
        response = self.client.put(
            "/api/reviews/1/approve/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        review = Review.objects.get(pk=response.data["id"])
        self.assertEqual(review.is_reviewed, True)
        self.assertEqual(review.ticket.status, "reviewed")

        self.assertGreaterEqual(review.reviewed_at, before_call)
    
    def test_reject(self):
        self._login_as("reviewer001")
        note = 'test-note'
        data = {"ticket_timestamp": "2019-08-06 03:06:33.584034+00:00", "note": note}
        before_call = timezone.now()
        
        response = self.client.put(
            "/api/reviews/1/reject/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        review = Review.objects.get(pk=response.data["id"])
        self.assertEqual(review.is_reviewed, False)
        self.assertEqual(review.is_reject, True)
        self.assertEqual(review.note, note)
        self.assertEqual(review.ticket.status, "rejected")

        self.assertGreaterEqual(review.reviewed_at, before_call)
      
    def test_commented(self):
        self._login_as("reviewer001")
        note = 'test-note-comment'
        data = {"ticket_timestamp": "2019-08-06 03:06:33.584034+00:00", "note": note}
        before_call = timezone.now()
        
        response = self.client.put(
            "/api/reviews/1/comment/",
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        review = Review.objects.get(pk=response.data["id"])
        self.assertEqual(review.is_reviewed, False)
        self.assertEqual(review.is_reject, None)
        self.assertEqual(review.note, note)
        self.assertEqual(review.ticket.status, "commented")

        self.assertGreaterEqual(review.reviewed_at, before_call)  
    
        