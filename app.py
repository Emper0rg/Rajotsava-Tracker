import csv, io, os, secrets
from datetime import datetime
from functools import wraps
from urllib.parse import quote
from flask import (Flask, Response, abort, flash, jsonify, redirect,
                   render_template, request, send_file, session, url_for)
from flask_sqlalchemy import SQLAlchemy
import qrcode
import config as C

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")
uri = os.environ.get("DATABASE_URL")
if not uri:
    # In local dev, we use sqlite. In production, we MUST have a DATABASE_URL.
    if os.environ.get("RENDER") == "true":
        raise RuntimeError("DATABASE_URL environment variable is missing! The app cannot save data on Render.")
    uri = "sqlite:///rajyotsava.db"

if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = uri
db = SQLAlchemy(app)


class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    usn = db.Column(db.String(20), unique=True)
    roll_no = db.Column(db.Integer)
    year = db.Column(db.Integer, default=1)  # 1, 2, or 3
    section = db.Column(db.String(1), default="A")
    cultural_interest = db.Column(db.String(255))
    payments = db.relationship("Payment", backref="student")

    @property
    def total(self):
        return sum(p.amount for p in self.payments if p.status == "verified")


class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    method = db.Column(db.String(10), default="upi")        # upi | cash
    utr = db.Column(db.String(20), unique=True)             # cash has none
    status = db.Column(db.String(10), default="pending")    # pending | verified | rejected
    created = db.Column(db.DateTime, default=datetime.utcnow)


with app.app_context():
    db.create_all()


def stats():
    ok = Payment.query.filter_by(status="verified").all()
    n = Student.query.count()
    who = {p.student_id for p in ok}
    return dict(total=sum(p.amount for p in ok), contributors=len(who), students=n,
                upi=sum(p.amount for p in ok if p.method == "upi"),
                cash=sum(p.amount for p in ok if p.method == "cash"),
                pct=round(100 * len(who) / n) if n else 0)


@app.context_processor
def inject():
    session.setdefault("csrf", secrets.token_hex(16))
    return dict(cfg=C, csrf=session["csrf"])


@app.before_request
def csrf_check():
    if request.method == "POST" and request.form.get("csrf") != session.get("csrf"):
        abort(400)


def admin_only(f):
    @wraps(f)
    def wrap(*a, **k):
        if not session.get("admin"):
            return redirect(url_for("admin"))
        return f(*a, **k)
    return wrap


@app.get("/")
def home():
    return render_template("home.html", s=stats(),
                           students=Student.query.order_by(Student.year, Student.section, Student.name).all())


@app.get("/api/students")
def api_students():
    year = request.args.get("year", type=int)
    section = request.args.get("section", "").strip().upper()
    query = Student.query
    if year:
        query = query.filter_by(year=year)
    if section:
        query = query.filter_by(section=section)
    students = query.order_by(Student.usn, Student.name).all()
    return jsonify([{
        "id": s.id,
        "name": s.name,
        "usn": s.usn or "",
        "year": s.year,
        "section": s.section
    } for s in students])


@app.post("/claim")
def claim():
    sid = request.form.get("student_id", type=int)
    s = db.session.get(Student, sid) if sid else None
    amount = request.form.get("amount", type=int)
    utr = request.form.get("utr", "").strip()
    if not s or not amount or not 1 <= amount <= 100000:
        flash("Pick your name/USN and enter a valid amount.", "err")
    elif not (utr.isdigit() and len(utr) == 12):
        flash("The UTR must be exactly 12 digits. Check your UPI receipt.", "err")
    elif Payment.query.filter_by(utr=utr).first():
        flash("That UTR was already submitted.", "err")
    else:
        db.session.add(Payment(student_id=s.id, amount=amount, utr=utr))
        db.session.commit()
        flash("Thanks! Your payment will show in the directory once your CR verifies it.", "ok")
    return redirect(url_for("home"))


@app.post("/cultural")
def cultural():
    sid = request.form.get("student_id", type=int)
    interest = request.form.get("interest", "").strip()
    s = db.session.get(Student, sid)
    if not s or not interest:
        flash("Please select your name and enter your interest.", "err")
    else:
        s.cultural_interest = interest
        db.session.commit()
        flash("Your interest in cultural programs has been recorded!", "ok")
    return redirect(url_for("home"))


@app.get("/students")
def directory():
    return render_template("directory.html", s=stats(),
                           students=Student.query.order_by(Student.year, Student.section, Student.name).all())


@app.get("/qr/<int:year>/<section>")
@app.get("/qr.png")
def qr(year=None, section=None):
    # If specific year and section requested, check for dedicated file
    if year and section:
        specific = os.path.join(app.static_folder, "qrs", f"qr_{year}_{section.upper()}.png")
        if os.path.exists(specific):
            return send_file(specific)

    # Fallback to static/qr.png
    custom = os.path.join(app.static_folder, "qr.png")
    if os.path.exists(custom):
        return send_file(custom)

    # Generated dynamic fallback
    buf = io.BytesIO()
    qrcode.make(f"upi://pay?pa={C.UPI_ID}&pn={quote(C.UPI_NAME)}&cu=INR").save(buf, "PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png")


@app.get("/admin")
def admin():
    if not session.get("admin"):
        return render_template("admin.html", login=True)

    admin_year = session.get("admin_year")
    admin_section = session.get("admin_section")

    query_pays = Payment.query.join(Student)
    query_students = Student.query
    if admin_year:
        query_pays = query_pays.filter(Student.year == admin_year)
        query_students = query_students.filter(Student.year == admin_year)
    if admin_section:
        query_pays = query_pays.filter(Student.section == admin_section)
        query_students = query_students.filter(Student.section == admin_section)

    pays = query_pays.order_by(Payment.created.desc()).all()
    students = query_students.order_by(Student.usn, Student.name).all()

    # Calculate stats specifically for this section & year
    ok = [p for p in pays if p.status == "verified"]
    n = len(students)
    who = {p.student_id for p in ok}
    s = dict(
        total=sum(p.amount for p in ok),
        contributors=len(who),
        students=n,
        upi=sum(p.amount for p in ok if p.method == "upi"),
        cash=sum(p.amount for p in ok if p.method == "cash"),
        pct=round(100 * len(who) / n) if n else 0
    )

    return render_template("admin.html", login=False, s=s,
                           pending=[p for p in pays if p.status == "pending"],
                           recent=[p for p in pays if p.status != "pending"][:30],
                           students=students,
                           admin_year=admin_year,
                           admin_section=admin_section)


@app.post("/admin/login")
def login():
    year = request.form.get("year", type=int)
    section = request.form.get("section", "").strip().upper()
    password = request.form.get("password", "")

    expected_pwd = C.get_cr_password(year, section)
    if expected_pwd and secrets.compare_digest(password, expected_pwd):
        session["admin"] = True
        session["admin_year"] = year
        session["admin_section"] = section
    else:
        flash(f"Wrong password or selection for {year} Year Section {section}.", "err")
    return redirect(url_for("admin"))


@app.post("/admin/logout")
def logout():
    session.pop("admin", None)
    session.pop("admin_year", None)
    session.pop("admin_section", None)
    return redirect(url_for("home"))


@app.post("/admin/payment/<int:pid>/<action>")
@admin_only
def set_status(pid, action):
    p = db.session.get(Payment, pid) or abort(404)
    if action in ("verified", "rejected"):
        p.status = action
        db.session.commit()
    return redirect(url_for("admin"))


@app.post("/admin/cash")
@admin_only
def cash():
    sid, amt = request.form.get("student_id", type=int), request.form.get("amount", type=int)
    if sid and amt and amt > 0 and db.session.get(Student, sid):
        db.session.add(Payment(student_id=sid, amount=amt, method="cash", status="verified"))
        db.session.commit()
        flash("Cash payment recorded.", "ok")
    else:
        flash("Pick a student and enter an amount.", "err")
    return redirect(url_for("admin"))


@app.post("/admin/students")
@admin_only
def add_students():
    year = session.get("admin_year", 1)
    section = session.get("admin_section", "A")
    have = {s.name.lower() for s in Student.query.filter_by(year=year, section=section).all()}
    added = 0
    for line in request.form.get("names", "").splitlines():
        line = line.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split(",") if p.strip()]
        if len(parts) >= 2:
            usn, name = parts[0], parts[1]
        else:
            usn, name = None, line

        if name.lower() not in have:
            db.session.add(Student(name=name, usn=usn, year=year, section=section))
            have.add(name.lower())
            added += 1

    db.session.commit()
    flash(f"Added {added} student(s) to {year} Year Section {section}.", "ok")
    return redirect(url_for("admin"))


@app.get("/admin/export.csv")
@admin_only
def export():
    admin_year = session.get("admin_year")
    admin_section = session.get("admin_section")
    query = Payment.query.join(Student)
    if admin_year:
        query = query.filter(Student.year == admin_year)
    if admin_section:
        query = query.filter(Student.section == admin_section)

    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Student", "USN", "Year", "Section", "Amount", "Method", "UTR", "Status", "Date (UTC)"])
    for p in query.order_by(Payment.created).all():
        w.writerow([
            p.student.name,
            p.student.usn or "",
            p.student.year,
            p.student.section,
            p.amount,
            p.method,
            p.utr or "",
            p.status,
            p.created.strftime("%Y-%m-%d %H:%M")
        ])
    filename = f"payments_{admin_year}_{admin_section}.csv" if admin_year and admin_section else "payments.csv"
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={filename}"})


if __name__ == "__main__":
    app.run(debug=True)
