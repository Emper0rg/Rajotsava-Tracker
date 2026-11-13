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

# Year and Section configurations
# 1st Year: only Sections A and B
# 2nd Year: Sections A, B, and C
# 3rd Year: No sections (single batch)
CLASSES = {
    1: {"name": "1st Year", "sections": ["A", "B"]},
    2: {"name": "2nd Year", "sections": ["A", "B", "C"]},
    3: {"name": "3rd Year", "sections": []},
}

# Dedicated CR Passwords
CR_PASSWORDS = {
    # 1st Year (Sections A and B only)
    "1-A": os.environ.get("CR_PASSWORD_1A", "admin1A"),
    "1-B": os.environ.get("CR_PASSWORD_1B", "admin1B"),

    # 2nd Year (Sections A, B, and C)
    "2-A": os.environ.get("CR_PASSWORD_2A", "admin2A"),
    "2-B": os.environ.get("CR_PASSWORD_2B", "admin2B"),
    "2-C": os.environ.get("CR_PASSWORD_2C", "admin2C"),

    # 3rd Year (No section)
    "3": os.environ.get("CR_PASSWORD_3", os.environ.get("CR_PASSWORD_3A", "admin3")),
    "3-A": os.environ.get("CR_PASSWORD_3", os.environ.get("CR_PASSWORD_3A", "admin3")),
}

# Dedicated CR WhatsApp Contacts (from static/Whatsapp numbers/Numbers.txt)
CR_CONTACTS = {
    "1-A": {"name": "Manohar R", "phone": "+91 90190 41255", "wa": "919019041255", "label": "1st Year Sec A"},
    "1-B": {"name": "Mohammed Riyan", "phone": "+91 98867 79436", "wa": "919886779436", "label": "1st Year Sec B"},
    "2-A": {
        "name": "Guru Vishnu M & Shwetha M R",
        "phone": "+91 96639 79235 / +91 73381 12694",
        "wa": "919663979235",
        "label": "2nd Year Sec A",
        "contacts": [
            {"name": "Guru Vishnu M", "phone": "+91 96639 79235", "wa": "919663979235"},
            {"name": "Shwetha M R", "phone": "+91 73381 12694", "wa": "917338112694"}
        ]
    },
    "2-B": {"name": "Prasad Mouli", "phone": "+91 97432 32215", "wa": "919743232215", "label": "2nd Year Sec B"},
    "2-C": {"name": "Guru Kiran", "phone": "+91 90198 49002", "wa": "919019849002", "label": "2nd Year Sec C"},
    "3":   {"name": "Suhel Siddiqee", "phone": "+91 81977 02182", "wa": "918197702182", "label": "3rd Year"},
    "3-A": {"name": "Suhel Siddiqee", "phone": "+91 81977 02182", "wa": "918197702182", "label": "3rd Year"},
}

def get_cr_password(year, section=None):
    if not year:
        return None
    try:
        y = int(year)
    except (ValueError, TypeError):
        return None
    if y == 3:
        return CR_PASSWORDS.get("3")
    sec = section.strip().upper() if section else ""
    return CR_PASSWORDS.get(f"{y}-{sec}")

def get_cr_contact(year, section=None):
    if not year:
        return None
    try:
        y = int(year)
    except (ValueError, TypeError):
        return None
    if y == 3:
        return CR_CONTACTS.get("3")
    sec = section.strip().upper() if section else ""
    return CR_CONTACTS.get(f"{y}-{sec}")
