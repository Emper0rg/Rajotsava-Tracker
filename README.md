# Kannada Rajyotsava contribution tracker (Flask)

## Run locally
    pip install -r requirements.txt
    python app.py        # http://127.0.0.1:5000  (admin password: changeme)

## Set up
1. Edit `config.py`: event details, `UPI_ID`, `UPI_NAME`. Optionally drop your own QR at `static/qr.png`.
2. Open **CR Admin**, log in, and paste the student names (one per line).

## Deploy on Render
1. Push this folder to a GitHub repo.
2. Render > New > Blueprint > pick the repo (it reads `render.yaml`, creating the web service and a free Postgres database).
3. When asked, set `CR_PASSWORD` to a strong password.

Use Postgres on Render: the free web service's disk is wiped on redeploy, so SQLite would lose data.
