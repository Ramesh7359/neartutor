# NearTutor — Setup & Startup Guide

## Quick Start

### Step 1: Open PowerShell and navigate to backend
```powershell
cd "c:\Users\rpusala\Downloads\kiro-workshop-assets\kiro-workshop\neartutor\backend"
```

### Step 2: Install dependencies (first time only)
```powershell
pip install fastapi uvicorn sqlalchemy python-jose python-multipart aiofiles jinja2
```

### Step 3: Start the server
```powershell
python main.py
```

Server runs on: http://localhost:8001

### Step 4: Open in browser
- **Customer site:** Open `neartutor\frontend\index.html` in browser
- **API docs:** http://localhost:8001/docs

## To Stop
Press `Ctrl + C` in PowerShell

## Default Test Data
3 sample teachers are auto-created:
- Ramesh Kumar (Maths) — Kukatpally
- Priya Sharma (Physics, Chemistry) — KPHB
- Suresh Reddy (English) — Ameerpet
