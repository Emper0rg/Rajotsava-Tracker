import pandas as pd
import pdfplumber
from app import app, db, Student
import os

def import_students():
    with app.app_context():
        # Clear existing students to avoid duplicates during testing
        # db.session.query(Student).delete() 

        # 1st Year Section A
        try:
            df = pd.read_excel("rajyotsava/Student lists/1st year Section_A_Students.xlsx")
            for idx, row in df.iterrows():
                name = str(row.iloc[1]) if len(row) > 1 else "Unknown"
                usn = str(row.iloc[0]) if len(row) > 0 else f"UNK_{idx}"
                db.session.add(Student(name=name, usn=usn, year=1, section="A", roll_no=idx+1))
            print("Imported 1st Year Section A")
        except Exception as e:
            print(f"Error 1st A: {e}")

        # 1st Year Section B
        try:
            df = pd.read_excel("rajyotsava/Student lists/1st yearSection_B_Students.xlsx")
            for idx, row in df.iterrows():
                name = str(row.iloc[1]) if len(row) > 1 else "Unknown"
                usn = str(row.iloc[0]) if len(row) > 0 else f"UNK_{idx}"
                db.session.add(Student(name=name, usn=usn, year=1, section="B", roll_no=idx+1))
            print("Imported 1st Year Section B")
        except Exception as e:
            print(f"Error 1st B: {e}")

        # 2nd Year Section A
        try:
            df = pd.read_excel("rajyotsava/Student lists/2nd year a sec.xlsx")
            for idx, row in df.iterrows():
                name = str(row.iloc[1]) if len(row) > 1 else "Unknown"
                usn = str(row.iloc[0]) if len(row) > 0 else f"UNK_{idx}"
                db.session.add(Student(name=name, usn=usn, year=2, section="A", roll_no=idx+1))
            print("Imported 2nd Year Section A")
        except Exception as e:
            print(f"Error 2nd A: {e}")

        # 3rd Year (PDF)
        try:
            with pdfplumber.open("rajyotsava/Student lists/3rd year students.pdf") as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        for line in text.splitlines():
                            parts = line.split()
                            if len(parts) >= 2:
                                usn = parts[0]
                                name = " ".join(parts[1:])
                                db.session.add(Student(name=name, usn=usn, year=3, section="A", roll_no=0))
            print("Imported 3rd Year")
        except Exception as e:
            print(f"Error 3rd Year: {e}")

        db.session.commit()
        print("All imports completed successfully!")

if __name__ == "__main__":
    import os
    # Force the app to use the correct DB path for the script
    os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite:///rajyotsava/instance/rajyotsava.db"
    import app as flask_app
    import_students()
