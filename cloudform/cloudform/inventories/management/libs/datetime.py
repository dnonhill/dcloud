import datetime
import pytz


def to_utc(datetime_str):
    """
    Convert Bangkok datetime string (this format '2024-07-04 00:00:00')
    to python datetime object in UTC timezone.

    Parameters
    ----------
    datetime_str : str
        example '2024-07-04 00:00:00'

    Returns
    -------
    datetime
        example 2024-07-03 17:00:00+00:00
    """
    bkk_tz = pytz.timezone('Asia/Bangkok')
    date_time = datetime.datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
    bkk_date_time = bkk_tz.localize(date_time)
    utc_date_time = bkk_date_time.astimezone(pytz.utc)
    return utc_date_time


def start_date_time_utc(date_str):
    return to_utc(f'{date_str} 00:00:00')


def end_date_time_utc(date_str):
    return to_utc(f'{date_str} 23:59:59')
