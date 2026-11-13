# Kannada Rajyotsava contribution tracker (Flask)

## Run locally
```bash
pip install -r requirements.txt
python import_students.py # Populates student roster into the database
python app.py             # http://127.0.0.1:5000
```

### CR Admin Default Passwords
Each combination of Class/Year and Section has a dedicated CR password (configurable in `config.py` or via environment variables `CR_PASSWORD_1A`, etc.):
- **1st Year Section A**: `admin1A`
- **1st Year Section B**: `admin1B`
- **1st Year Section C**: `admin1C`
- **2nd Year Section A**: `admin2A`
- **2nd Year Section B**: `admin2B`
- **2nd Year Section C**: `admin2C`
- **3rd Year Section A**: `admin3A`
- **3rd Year Section B**: `admin3B`
- **3rd Year Section C**: `admin3C`

## Dedicated CR QR Codes
Default QR code images are located in `static/qrs/`:
- `qr_1_A.png`, `qr_1_B.png`, `qr_1_C.png`
- `qr_2_A.png`, `qr_2_B.png`, `qr_2_C.png`
- `qr_3_A.png`, `qr_3_B.png`, `qr_3_C.png`
Replace any of these files with your CR's specific QR code image whenever you want.

## Deploy on Render
1. Push this folder to a GitHub repository.
2. In Render: New > Blueprint > select repository (`render.yaml`).
3. Set the respective CR passwords for each class in the environment variables.
