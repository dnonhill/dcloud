import concurrent.futures
import signal
import time
from smtplib import SMTPException

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand

from cloudform.mail.models import MailMessage


class Command(BaseCommand):
    help = "Sending pending mail message in db"

    SENT_COMPLETED = "completed"
    SENT_ERROR = "error"

    done = False

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=int,
            default=10,
            help="Interval to fetch the messages to send",
        )

        parser.add_argument(
            "--worker",
            type=int,
            default=1,
            help="The number of worker to send mail in parallel",
        )

        parser.add_argument(
            "--daemon", action="store_true", help="Run as a daemon service"
        )

    def signal_handler(self, sig, frame):
        self.stdout.write("Receive terminating signal.")
        self.stdout.write("Mail service is shutting down.")
        self.done = True

    def handle(self, *args, **options):
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

        # Initialize worker pool for sending the mail
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=options["worker"]
        ) as pool:

            self.stdout.write("Mail service is starting.")

            is_idle = False

            while not self.done:
                # Fetch mail message from pending queue (fetching in batch size)
                pending_msgs = self.get_pending_msgs()

                # Pause continuous fetching for the specified interval in case of no pending messages
                msg_len = pending_msgs.count()
                if msg_len == 0:

                    # Make service log idle status unobtrusively
                    if not is_idle:
                        is_idle = True
                        self.stdout.write(f"No pending messages in queue.")

                    time.sleep(options["interval"])
                    continue

                # Submit sending task and update msg status
                future_to_msg = {
                    pool.submit(self.worker, msg): msg for msg in pending_msgs.all()
                }

                # Wait for all task completed and set flag for messages
                for future in concurrent.futures.as_completed(future_to_msg):
                    done_msg = future_to_msg[future]
                    status, err = future.result()

                    done_msg.attempts = done_msg.attempts + 1

                    if status == self.SENT_COMPLETED:
                        done_msg.is_sent = True

                    elif status == self.SENT_ERROR:
                        error_msg = str(err)
                        self.stderr.write(str(err))

                        # In case of SMTP error, we can do nothing for the mail
                        if isinstance(err, SMTPException):
                            done_msg.is_error = True
                            done_msg.error_msg = error_msg

                    done_msg.save()

                is_idle = False

                # Run once if not in daemon mode
                if not options["daemon"]:
                    self.done = True

        self.stdout.write("Mail service was stopped.")

    def get_pending_msgs(self):
        return (
            MailMessage.objects.pending()
            .filter(attempts__lt=settings.SENDMAIL_MAX_ATTEMPTS)
            .order_by("updated_at")
        )

    def worker(self, msg):
        self.stdout.write(f"Attempt sending message {msg.id}")
        try:
            content = msg.render()

            kwargs = {}
            if msg.is_html():
                kwargs["html_message"] = content

            send_mail(msg.subject, content, msg.sender, msg.recipients, **kwargs)

            self.stdout.write(f"Message {msg.id} can be sent")
            return self.SENT_COMPLETED, None

        except Exception as err:
            self.stdout.write(f"Message {msg.id} cannot be sent {type(err)}")
            return self.SENT_ERROR, err
