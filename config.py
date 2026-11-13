import os

# ---- Edit these for your class/event ----
EVENT_NAME = "Kannada Rajyotsava 2026"
COLLEGE = "Bangalore University"
CLASS_NAME = "BCA Department"
EVENT_DATE = "17 November 2026"
PURPOSE = "a grand auditorium celebration with a festive lunch and a series of cultural programs"
SUGGESTED = 200
AMOUNTS = [100, 200, 300, 500]
UPI_ID = "9611299256@axl"
UPI_NAME = "Guru"

# Available Years and Sections
YEARS = [
    {"val": 1, "label": "1st Year"},
    {"val": 2, "label": "2nd Year"},
    {"val": 3, "label": "3rd Year"},
]

SECTIONS = ["A", "B", "C"]

# Admin passwords for each (year, section) combination:
# Format of key: f"{year}-{section}" (e.g. "1-A", "2-B")
# Environment variables: CR_PASSWORD_1A, CR_PASSWORD_1B, etc.
# Default fallback passwords: admin1A, admin1B, admin2A, etc.
CR_PASSWORDS = {}
for y in [1, 2, 3]:
    for s in ["A", "B", "C"]:
        env_key = f"CR_PASSWORD_{y}{s}"
        default_pwd = f"admin{y}{s}"
        CR_PASSWORDS[f"{y}-{s}"] = os.environ.get(env_key, default_pwd)

def get_cr_password(year, section):
    if not year or not section:
        return None
    return CR_PASSWORDS.get(f"{year}-{section.upper()}")
