import os
# ---- Edit these for your class/event ----
EVENT_NAME = "Kannada Rajyotsava 2026"
COLLEGE = "Bangalore University"
CLASS_NAME = "BCA 2nd Year"
EVENT_DATE = "17 November 2026"
PURPOSE = "a grand auditorium celebration with a festive lunch and a series of cultural programs"
SUGGESTED = 200
AMOUNTS = [100, 200, 300, 500]
UPI_ID = "9611299256@axl"
UPI_NAME = "Guru"
# Put your own QR image at static/qr.png to use it instead of the generated one.
# Admin passwords for each section
CR_PASSWORDS = {
    "A": os.environ.get("CR_PASSWORD_A", "adminA"),
    "B": os.environ.get("CR_PASSWORD_B", "adminB"),
    "C": os.environ.get("CR_PASSWORD_C", "adminC"),
}
