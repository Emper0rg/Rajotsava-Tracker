import csv, io, os, secrets
from datetime import datetime
from functools import wraps
from urllib.parse import quote
from flask import (Flask, Response, abort, flash, redirect, render_template,
                   request, send_file, session, url_for)
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
    usn = db.Column(db.String(20), unique=True, nullable=False)
    roll_no = db.Column(db.Integer)
    year = db.Column(db.Integer, nullable=False) # 1, 2, or 3
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
    utr = db.Column(db.String(20), unique=True)              # cash has none
    status = db.Column(db.String(10), default="pending")     # pending | verified | rejected
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
                           students=Student.query.order_by(Student.name).all())


@app.post("/claim")
def claim():
    sid = request.form.get("student_id", type=int)
    s = db.session.get(Student, sid) if sid else None
    amount = request.form.get("amount", type=int)
    utr = request.form.get("utr", "").strip()
    if not s or not amount or not 1 <= amount <= 100000:
        flash("Pick your name and enter a valid amount.", "err")
    elif not (utr.isdigit() and len(utr) == 12):
        flash("The UTR must be exactly 12 digits. Check your UPI receipt.", "err")
    elif Payment.query.filter_by(utr=utr).first():
        flash("That UTR was already submitted.", "err")
    else:
        db.session.add(Payment(student_id=s.id, amount=amount, utr=utr))
        db.session.commit()
        flash("Thanks! Your payment will show once a CR verifies it.", "ok")
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
                           students=Student.query.order_by(Student.name).all())


@app.get("/qr.png")
def qr():
    custom = os.path.join(app.static_folder, "qr.png")
    if os.path.exists(custom):
        return send_file(custom)
    buf = io.BytesIO()
    qrcode.make(f"upi://pay?pa={C.UPI_ID}&pn={quote(C.UPI_NAME)}&cu=INR").save(buf, "PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png")


@app.get("/admin")
def admin():
    if not session.get("admin"):
        return render_template("admin.html", login=True)

    # Filter payments and students by the admin's assigned section
    section = session.get("admin_section")
    pays = Payment.query.join(Student).filter(Student.section == section).order_by(Payment.created.desc()).all()
    students = Student.query.filter_by(section=section).order_by(Student.name).all()

    # Calculate stats specifically for this section
    ok = Payment.query.join(Student).filter(Student.section == section, Payment.status == "verified").all()
    n = len(students)
    who = {p.student_id for p in ok}
    s = dict(total=sum(p.amount for p in ok), contributors=len(who), students=n,
            upi=sum(p.amount for p in ok if p.method == "upi"),
            cash=sum(p.amount for p in ok if p.method == "cash"),
            pct=round(100 * len(who) / n) if n else 0)

    return render_template("admin.html", login=False, s=s,
                           pending=[p for p in pays if p.status == "pending"],
                           recent=[p for p in pays if p.status != "pending"][:30],
                           students=students)


@app.post("/admin/login")
def login():
    section = request.form.get("section")
    password = request.form.get("password", "")

    if section in C.CR_PASSWORDS and secrets.compare_digest(password, C.CR_PASSWORDS[section]):
        session["admin"] = True
        session["admin_section"] = section
    else:
        flash("Wrong section or password.", "err")
    return redirect(url_for("admin"))


@app.post("/admin/logout")
def logout():
    session.pop("admin", None)
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
    section = request.form.get("section", "A")
    have = {s.name.lower() for s in Student.query.all()}
    added = 0
    for line in request.form.get("names", "").splitlines():
        name = line.strip()
        if name and name.lower() not in have:
            db.session.add(Student(name=name, section=section)); have.add(name.lower()); added += 1
    db.session.commit()
    flash(f"Added {added} student(s) to Section {section}.", "ok")
    return redirect(url_for("admin"))


@app.get("/admin/export.csv")
@admin_only
def export():
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Student", "Amount", "Method", "UTR", "Status", "Date (UTC)"])
    for p in Payment.query.order_by(Payment.created).all():
        w.writerow([p.student.name, p.amount, p.method, p.utr or "", p.status,
                    p.created.strftime("%Y-%m-%d %H:%M")])
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=payments.csv"})


if __name__ == "__main__":
    app.run(debug=True)
