import os
import pandas as pd
from app import app, db, Student

THIRD_YEAR_STUDENTS = [
    # Page 1
    ("U03CJ24S0049", "Amrutha G P"),
    ("U03NK24S0026", "Darshan S D"),
    ("U03NK24S0027", "Suresh"),
    ("U03NK24S0028", "Suhel"),
    ("U03NK24S0029", "Manoj"),
    ("U03NK24S0030", "Mahanandish C"),
    ("U03NK24S0033", "Mothilal N"),
    ("U03NK24S0034", "Gireesh Khane"),
    ("U03NK24S0036", "Mohammed Muzakkir"),
    ("U03NK24S0037", "Manoj K"),
    ("U03NK24S0039", "V Deepali"),
    ("U03NK24S0040", "B.Meghana"),
    ("U03NK24S0041", "Chinmayi H M"),
    ("U03NK24S0042", "Hemanth Aradhya N"),
    ("U03NK24S0043", "Keerthan G"),
    ("U03NK24S0044", "Kishore K"),
    ("U03NK24S0045", "Monisha N"),
    ("U03NK24S0046", "Nuthan H N"),
    ("U03NK24S0047", "Pavan H G"),
    ("U03NK24S0048", "Priyanka J"),
    ("U03NK24S0049", "Rachana R"),
    ("U03NK24S0050", "Rithuja M"),
    ("U03NK24S0051", "Samresh S"),
    ("U03NK24S0052", "Santosh"),
    ("U03NK24S0053", "Shashikala M"),
    ("U03NK24S0054", "Shravani C R"),
    ("U03NK24S0055", "Shreyas"),
    ("U03NK24S0056", "Siddappa Nayaka"),
    ("U03NK24S0058", "Shashikala G E"),
    # Page 2
    ("U03NK24S0059", "Savitri"),
    ("U03NK24S0060", "R varsha"),
    ("U03NK24S0061", "Prarthana K C"),
    ("U03NK24S0062", "Shruthi R"),
    ("U03NK24S0063", "Bharath V"),
    ("U03NK24S0064", "Bhanukeerthi P"),
    ("U03NK24S0065", "Lalitha G S"),
    ("U03NK24S0066", "Pooja U"),
    ("U03NK24S0067", "Chethan Prasad B S"),
    ("U03NK24S0068", "Ananya Miraskar P"),
    ("U03NK24S0069", "D Pallavi"),
    ("U03NK24S0070", "Darshan G"),
    ("U03NK24S0071", "Divya B"),
    ("U03NK24S0073", "Gagana M R"),
    ("U03NK24S0074", "Gowtham R"),
    ("U03NK24S0075", "Hemavathi C G"),
    ("U03NK24S0078", "Kousalya S"),
    ("U03NK24S0079", "Lavanya M"),
    ("U03NK24S0081", "Manoj Reddy A"),
    ("U03NK24S0082", "Kavya H"),
    ("U03NK24S0085", "Siri V"),
    ("U03NK24S0086", "Sahana R"),
    ("U03NK24S0087", "Spoorthi S R"),
    ("U03NK24S0090", "Dhanya Shree G J"),
    ("U03NK24S0091", "N S Ganavi"),
    ("U03NK24S0092", "Neha C"),
    ("U03NK24S0095", "Preetham S"),
    ("U03NK24S0096", "Renuka S"),
    ("U03NK24S0097", "Praven kumar.S"),
    # Page 3
    ("U03NK24S0098", "Punith kumar M A"),
    ("U03NK24S0099", "Niranjan S Andaani"),
    ("U03NK24S0100", "Madan Sunil Chimal"),
    ("U03NK24S0101", "Manoj G"),
    ("U03NK24S0102", "Prajwal C H"),
    ("U03NK24S0103", "HEMANTH C K"),
    ("U03NK24S0105", "Nithin M"),
    ("U03NK24S0111", "Chandana C"),
    ("U03NK24S0114", "Lakshmi P"),
    ("U03NK24S0115", "Puneeth Raj N R"),
    ("U03NK24S0116", "Bhavani H"),
    ("U03NK24S0117", "Bhagya Lakshmi S"),
    ("U03NK24S0118", "Syed Musharaf"),
    ("U03NK24S0119", "Rajesh V"),
    ("U03NK24S0123", "Kavana M"),
    ("U03NK24S0124", "Monisha P"),
    ("U03NK24S0125", "Pavan V Gopal"),
    ("U03NK24S0130", "Nandini G A"),
    ("U03NK24S0134", "Yashwanth K V"),
    ("U03NK24S0135", "S Mahesh"),
    ("U03NK24S0139", "Rukmini Shreya"),
]

def import_students():
    with app.app_context():
        db.create_all()
        existing_usns = {s.usn.strip().upper() for s in Student.query.all() if s.usn}
        base_dir = os.path.dirname(os.path.abspath(__file__))
        student_lists_dir = os.path.join(base_dir, "Student lists")

        # 1. 1st Year Section A
        file_1a = os.path.join(student_lists_dir, "1st year Section_A_Students.xlsx")
        if os.path.exists(file_1a):
            try:
                df1a = pd.read_excel(file_1a)
                count_1a = 0
                for _, row in df1a.iterrows():
                    usn = str(row["USN"]).strip()
                    name = str(row["Name"]).strip()
                    roll = int(row["Sl No"]) if pd.notna(row.get("Sl No")) else None
                    if usn and usn.upper() not in existing_usns:
                        db.session.add(Student(name=name, usn=usn, year=1, section="A", roll_no=roll))
                        existing_usns.add(usn.upper())
                        count_1a += 1
                print(f"Imported {count_1a} students for 1st Year Section A")
            except Exception as e:
                print(f"Error reading 1st A: {e}")

        # 2. 1st Year Section B
        file_1b = os.path.join(student_lists_dir, "1st yearSection_B_Students.xlsx")
        if os.path.exists(file_1b):
            try:
                df1b = pd.read_excel(file_1b)
                count_1b = 0
                for _, row in df1b.iterrows():
                    usn = str(row["USN"]).strip()
                    name = str(row["Name"]).strip()
                    roll = int(row["Sl No"]) if pd.notna(row.get("Sl No")) else None
                    if usn and usn.upper() not in existing_usns:
                        db.session.add(Student(name=name, usn=usn, year=1, section="B", roll_no=roll))
                        existing_usns.add(usn.upper())
                        count_1b += 1
                print(f"Imported {count_1b} students for 1st Year Section B")
            except Exception as e:
                print(f"Error reading 1st B: {e}")

        # 3. 2nd Year Section A
        file_2a = os.path.join(student_lists_dir, "2nd year a sec.xlsx")
        if os.path.exists(file_2a):
            try:
                df2a = pd.read_excel(file_2a, skiprows=8, header=None)
                count_2a = 0
                for _, row in df2a.iterrows():
                    if pd.isna(row[1]) or pd.isna(row[2]):
                        continue
                    usn = str(row[1]).strip()
                    name = str(row[2]).strip()
                    roll = int(row[0]) if pd.notna(row[0]) and str(row[0]).isdigit() else None
                    if usn and usn.upper() not in existing_usns:
                        db.session.add(Student(name=name, usn=usn, year=2, section="A", roll_no=roll))
                        existing_usns.add(usn.upper())
                        count_2a += 1
                print(f"Imported {count_2a} students for 2nd Year Section A")
            except Exception as e:
                print(f"Error reading 2nd A: {e}")

        # 4. 2nd Year Section B
        file_2b = os.path.join(student_lists_dir, "2nd_Year_B_Controlistfinal.xlsx")
        if os.path.exists(file_2b):
            try:
                df2b = pd.read_excel(file_2b, skiprows=3)
                df2b = df2b.dropna(subset=["USN", "Student Name"])
                count_2b = 0
                for _, row in df2b.iterrows():
                    usn = str(row["USN"]).strip()
                    name = str(row["Student Name"]).strip()
                    roll = int(row["#"]) if pd.notna(row.get("#")) and str(row.get("#")).isdigit() else None
                    if usn.upper().startswith("U03"):
                        candidate_usn = usn
                        suffix = 2
                        while candidate_usn.upper() in existing_usns:
                            # If exact same name and USN already added, skip
                            match = Student.query.filter_by(usn=candidate_usn).first()
                            if match and match.name.lower() == name.lower():
                                candidate_usn = None
                                break
                            candidate_usn = f"{usn}_{suffix}"
                            suffix += 1
                        if candidate_usn:
                            db.session.add(Student(name=name, usn=candidate_usn, year=2, section="B", roll_no=roll))
                            existing_usns.add(candidate_usn.upper())
                            count_2b += 1
                print(f"Imported {count_2b} students for 2nd Year Section B")
            except Exception as e:
                print(f"Error reading 2nd B: {e}")

        # 5. 2nd Year Section C
        file_2c = os.path.join(student_lists_dir, "2nd_Year_C_Contribution_List.xlsx")
        if os.path.exists(file_2c):
            try:
                df2c = pd.read_excel(file_2c, skiprows=3)
                df2c = df2c.dropna(subset=["USN", "Student Name"])
                count_2c = 0
                for _, row in df2c.iterrows():
                    usn = str(row["USN"]).strip()
                    name = str(row["Student Name"]).strip()
                    roll = int(row["#"]) if pd.notna(row.get("#")) and str(row.get("#")).isdigit() else None
                    if usn.upper().startswith("U03"):
                        candidate_usn = usn
                        suffix = 2
                        while candidate_usn.upper() in existing_usns:
                            match = Student.query.filter_by(usn=candidate_usn).first()
                            if match and match.name.lower() == name.lower():
                                candidate_usn = None
                                break
                            candidate_usn = f"{usn}_{suffix}"
                            suffix += 1
                        if candidate_usn:
                            db.session.add(Student(name=name, usn=candidate_usn, year=2, section="C", roll_no=roll))
                            existing_usns.add(candidate_usn.upper())
                            count_2c += 1
                print(f"Imported {count_2c} students for 2nd Year Section C")
            except Exception as e:
                print(f"Error reading 2nd C: {e}")

        # 6. 3rd Year Section A
        count_3a = 0
        for idx, (usn, name) in enumerate(THIRD_YEAR_STUDENTS, start=1):
            usn_clean = usn.strip()
            if usn_clean and usn_clean.upper() not in existing_usns:
                db.session.add(Student(name=name.strip(), usn=usn_clean, year=3, section="A", roll_no=idx))
                existing_usns.add(usn_clean.upper())
                count_3a += 1
        print(f"Imported {count_3a} students for 3rd Year Section A")

        db.session.commit()
        print(f"Total students now in database: {Student.query.count()}")

if __name__ == "__main__":
    import_students()
