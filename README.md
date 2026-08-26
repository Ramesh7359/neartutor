# NearTutor — Home Tuition Marketplace

## About
NearTutor connects students with nearby home tutors based on subject, location, and availability. Teachers register their expertise and students find tutors within their area.

## Tech Stack
- **Backend:** Python (FastAPI)
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Frontend:** HTML, CSS, JavaScript (mobile-friendly web app)

## Features
- Teacher registration with subjects, experience, fees, location
- Student registration with learning needs
- Location-based teacher search (pincode/area matching)
- Booking/request system
- Teacher and student dashboards
- Admin panel for platform management

## Quick Start
```bash
cd neartutor/backend
pip install fastapi uvicorn sqlalchemy python-jose python-multipart aiofiles jinja2
python main.py
```
Then open `frontend/index.html` in your browser.
