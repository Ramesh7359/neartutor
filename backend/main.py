from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, Base, get_db
from models import Teacher, Student, TuitionRequest, Review
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import json
import math
import jwt
import uvicorn
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NearTutor API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Config
JWT_SECRET = "neartutor-secret-key-2026"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(user_id: int, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km (Haversine formula)"""
    if not all([lat1, lon1, lat2, lon2]):
        return None
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return round(R * c, 1)


# ============ SEED DATA ============
@app.on_event("startup")
def seed_data():
    db = Session(bind=engine)
    if db.query(Teacher).count() == 0:
        teachers = [
            Teacher(
                name="Ramesh Kumar", phone="9876543210",
                email="ramesh@example.com", password_hash=hash_password("password123"),
                qualification="M.Sc Mathematics", experience_years=8,
                subjects=json.dumps(["Maths", "Statistics"]),
                classes=json.dumps(["Class 9", "Class 10", "Class 11", "Class 12", "IIT-JEE"]),
                teaching_mode="both", bio="Passionate math teacher with 8 years experience. IIT-JEE specialist.",
                area="Kukatpally", city="Hyderabad", pincode="500072",
                latitude=17.4948, longitude=78.3996, travel_radius_km=5,
                fee_per_hour=500, fee_per_month=5000,
                available_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
                available_time_from="06:00", available_time_to="21:00",
                is_verified=True, rating=4.8, total_students=25
            ),
            Teacher(
                name="Priya Sharma", phone="9876543211",
                email="priya@example.com", password_hash=hash_password("password123"),
                qualification="B.Tech + M.Ed", experience_years=5,
                subjects=json.dumps(["Physics", "Chemistry"]),
                classes=json.dumps(["Class 9", "Class 10", "Class 11", "Class 12"]),
                teaching_mode="home_visit", bio="Making Physics and Chemistry easy and fun!",
                area="KPHB Colony", city="Hyderabad", pincode="500072",
                latitude=17.4839, longitude=78.3890, travel_radius_km=4,
                fee_per_hour=600, fee_per_month=6000,
                available_days=json.dumps(["Mon", "Wed", "Fri", "Sat"]),
                available_time_from="16:00", available_time_to="20:00",
                is_verified=True, rating=4.6, total_students=18
            ),
            Teacher(
                name="Suresh Reddy", phone="9876543212",
                email="suresh@example.com", password_hash=hash_password("password123"),
                qualification="M.A English Literature", experience_years=10,
                subjects=json.dumps(["English", "Social Studies"]),
                classes=json.dumps(["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]),
                teaching_mode="both", bio="10 years experience in CBSE and ICSE English curriculum.",
                area="Ameerpet", city="Hyderabad", pincode="500016",
                latitude=17.4375, longitude=78.4483, travel_radius_km=6,
                fee_per_hour=400, fee_per_month=4000,
                available_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri"]),
                available_time_from="09:00", available_time_to="19:00",
                is_verified=True, rating=4.5, total_students=30
            ),
            Teacher(
                name="Lakshmi Devi", phone="9876543213",
                email="lakshmi@example.com", password_hash=hash_password("password123"),
                qualification="M.Sc Chemistry + B.Ed", experience_years=12,
                subjects=json.dumps(["Chemistry", "Biology"]),
                classes=json.dumps(["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "NEET"]),
                teaching_mode="both", bio="NEET specialist with 12 years of coaching experience. 50+ students cracked NEET.",
                area="Miyapur", city="Hyderabad", pincode="500049",
                latitude=17.4969, longitude=78.3548, travel_radius_km=6,
                fee_per_hour=700, fee_per_month=7000,
                available_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
                available_time_from="05:30", available_time_to="20:00",
                is_verified=True, rating=4.9, total_students=50
            ),
            Teacher(
                name="Vijay Prakash", phone="9876543214",
                email="vijay@example.com", password_hash=hash_password("password123"),
                qualification="B.Tech CSE, IIT Bombay", experience_years=4,
                subjects=json.dumps(["Computer Science", "Maths"]),
                classes=json.dumps(["Class 11", "Class 12", "IIT-JEE"]),
                teaching_mode="online", bio="IIT Bombay graduate. Teaching coding and advanced maths. JEE Mains & Advanced specialist.",
                area="Kondapur", city="Hyderabad", pincode="500084",
                latitude=17.4700, longitude=78.3538, travel_radius_km=10,
                fee_per_hour=800, fee_per_month=8000,
                available_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
                available_time_from="18:00", available_time_to="22:00",
                is_verified=True, rating=4.7, total_students=15
            ),
            Teacher(
                name="Fatima Begum", phone="9876543215",
                email="fatima@example.com", password_hash=hash_password("password123"),
                qualification="M.A Hindi + M.A Urdu", experience_years=15,
                subjects=json.dumps(["Hindi", "Telugu", "English"]),
                classes=json.dumps(["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"]),
                teaching_mode="home_visit", bio="Specializing in primary and middle school language development. Multilingual teaching.",
                area="Madhapur", city="Hyderabad", pincode="500081",
                latitude=17.4486, longitude=78.3908, travel_radius_km=4,
                fee_per_hour=350, fee_per_month=3500,
                available_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri"]),
                available_time_from="09:00", available_time_to="17:00",
                is_verified=True, rating=4.4, total_students=40
            ),
        ]
        db.add_all(teachers)
        db.commit()
    db.close()


# ============ AUTH ENDPOINTS ============
@app.post("/api/auth/teacher/login")
def teacher_login(request: dict, db: Session = Depends(get_db)):
    phone = request.get("phone")
    password = request.get("password")
    teacher = db.query(Teacher).filter_by(phone=phone).first()
    if not teacher or teacher.password_hash != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    token = create_token(teacher.id, "teacher")
    return {
        "token": token,
        "user": {
            "id": teacher.id, "name": teacher.name, "role": "teacher",
            "phone": teacher.phone, "email": teacher.email
        }
    }


@app.post("/api/auth/student/login")
def student_login(request: dict, db: Session = Depends(get_db)):
    phone = request.get("phone")
    password = request.get("password")
    student = db.query(Student).filter_by(phone=phone).first()
    if not student or student.password_hash != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    token = create_token(student.id, "student")
    return {
        "token": token,
        "user": {
            "id": student.id, "name": student.name, "role": "student",
            "phone": student.phone, "email": student.email
        }
    }


# ============ TEACHER ENDPOINTS ============
@app.post("/api/teachers/register")
def register_teacher(request: dict, db: Session = Depends(get_db)):
    existing = db.query(Teacher).filter_by(phone=request.get("phone")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    teacher = Teacher(
        name=request.get("name"),
        phone=request.get("phone"),
        email=request.get("email"),
        password_hash=hash_password(request.get("password", "password123")),
        qualification=request.get("qualification"),
        experience_years=request.get("experience_years", 0),
        subjects=json.dumps(request.get("subjects", [])),
        classes=json.dumps(request.get("classes", [])),
        teaching_mode=request.get("teaching_mode", "both"),
        bio=request.get("bio", ""),
        area=request.get("area"),
        city=request.get("city", "Hyderabad"),
        pincode=request.get("pincode"),
        latitude=request.get("latitude"),
        longitude=request.get("longitude"),
        travel_radius_km=request.get("travel_radius_km", 5),
        fee_per_hour=request.get("fee_per_hour", 0),
        fee_per_month=request.get("fee_per_month", 0),
        available_days=json.dumps(request.get("available_days", [])),
        available_time_from=request.get("available_time_from", "06:00"),
        available_time_to=request.get("available_time_to", "21:00"),
    )
    db.add(teacher)
    db.commit()
    token = create_token(teacher.id, "teacher")
    return {"message": "Teacher registered successfully", "id": teacher.id, "token": token}


@app.get("/api/teachers")
def get_teachers(subject: str = None, area: str = None, class_level: str = None,
                 mode: str = None, min_rating: float = None,
                 sort_by: str = "rating", db: Session = Depends(get_db)):
    query = db.query(Teacher).filter_by(is_active=True)
    teachers = query.all()

    result = []
    for t in teachers:
        subjects = json.loads(t.subjects) if t.subjects else []
        classes = json.loads(t.classes) if t.classes else []

        if subject and subject.lower() not in [s.lower() for s in subjects]:
            continue
        if area and area.lower() not in (t.area or "").lower():
            continue
        if class_level and class_level not in classes:
            continue
        if mode and mode != "both" and t.teaching_mode != "both" and t.teaching_mode != mode:
            continue
        if min_rating and t.rating < min_rating:
            continue

        result.append({
            "id": t.id, "name": t.name, "phone": t.phone,
            "qualification": t.qualification, "experience_years": t.experience_years,
            "subjects": subjects, "classes": classes,
            "teaching_mode": t.teaching_mode, "bio": t.bio,
            "area": t.area, "city": t.city, "pincode": t.pincode,
            "latitude": t.latitude, "longitude": t.longitude,
            "travel_radius_km": t.travel_radius_km,
            "fee_per_hour": t.fee_per_hour, "fee_per_month": t.fee_per_month,
            "rating": t.rating, "total_students": t.total_students,
            "is_verified": t.is_verified,
            "available_days": json.loads(t.available_days) if t.available_days else [],
            "available_time_from": t.available_time_from,
            "available_time_to": t.available_time_to,
        })

    # Sort results
    if sort_by == "rating":
        result.sort(key=lambda x: x["rating"], reverse=True)
    elif sort_by == "fee_low":
        result.sort(key=lambda x: x["fee_per_hour"])
    elif sort_by == "fee_high":
        result.sort(key=lambda x: x["fee_per_hour"], reverse=True)
    elif sort_by == "experience":
        result.sort(key=lambda x: x["experience_years"], reverse=True)

    return result


@app.get("/api/teachers/nearby")
def find_nearby_teachers(lat: float, lon: float, radius_km: float = 5,
                         subject: str = None, db: Session = Depends(get_db)):
    teachers = db.query(Teacher).filter_by(is_active=True).all()
    nearby = []

    for t in teachers:
        if not t.latitude or not t.longitude:
            continue
        distance = calculate_distance(lat, lon, t.latitude, t.longitude)
        if distance is not None and distance <= radius_km:
            subjects = json.loads(t.subjects) if t.subjects else []
            if subject and subject.lower() not in [s.lower() for s in subjects]:
                continue
            nearby.append({
                "id": t.id, "name": t.name,
                "qualification": t.qualification, "experience_years": t.experience_years,
                "subjects": subjects,
                "classes": json.loads(t.classes) if t.classes else [],
                "teaching_mode": t.teaching_mode, "bio": t.bio,
                "area": t.area, "fee_per_hour": t.fee_per_hour,
                "fee_per_month": t.fee_per_month,
                "rating": t.rating, "total_students": t.total_students,
                "is_verified": t.is_verified,
                "distance_km": distance,
            })

    nearby.sort(key=lambda x: x["distance_km"])
    return nearby


@app.get("/api/teachers/{teacher_id}")
def get_teacher_profile(teacher_id: int, db: Session = Depends(get_db)):
    t = db.query(Teacher).filter_by(id=teacher_id, is_active=True).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {
        "id": t.id, "name": t.name, "phone": t.phone, "email": t.email,
        "qualification": t.qualification, "experience_years": t.experience_years,
        "subjects": json.loads(t.subjects) if t.subjects else [],
        "classes": json.loads(t.classes) if t.classes else [],
        "teaching_mode": t.teaching_mode, "bio": t.bio,
        "area": t.area, "city": t.city, "pincode": t.pincode,
        "fee_per_hour": t.fee_per_hour, "fee_per_month": t.fee_per_month,
        "rating": t.rating, "total_students": t.total_students,
        "is_verified": t.is_verified,
        "available_days": json.loads(t.available_days) if t.available_days else [],
        "available_time_from": t.available_time_from,
        "available_time_to": t.available_time_to,
    }


@app.put("/api/teachers/{teacher_id}")
def update_teacher_profile(teacher_id: int, request: dict, db: Session = Depends(get_db),
                           payload: dict = Depends(verify_token)):
    if payload["role"] != "teacher" or payload["user_id"] != teacher_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    teacher = db.query(Teacher).filter_by(id=teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    updatable_fields = ["name", "email", "qualification", "experience_years",
                        "teaching_mode", "bio", "area", "city", "pincode",
                        "latitude", "longitude", "travel_radius_km",
                        "fee_per_hour", "fee_per_month",
                        "available_time_from", "available_time_to"]

    for field in updatable_fields:
        if field in request:
            setattr(teacher, field, request[field])

    if "subjects" in request:
        teacher.subjects = json.dumps(request["subjects"])
    if "classes" in request:
        teacher.classes = json.dumps(request["classes"])
    if "available_days" in request:
        teacher.available_days = json.dumps(request["available_days"])

    db.commit()
    return {"message": "Profile updated successfully"}


# ============ STUDENT ENDPOINTS ============
@app.post("/api/students/register")
def register_student(request: dict, db: Session = Depends(get_db)):
    existing = db.query(Student).filter_by(phone=request.get("phone")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    student = Student(
        name=request.get("name"),
        phone=request.get("phone"),
        email=request.get("email"),
        password_hash=hash_password(request.get("password", "password123")),
        student_name=request.get("student_name"),
        current_class=request.get("current_class"),
        subjects_needed=json.dumps(request.get("subjects_needed", [])),
        learning_mode=request.get("learning_mode", "both"),
        area=request.get("area"),
        city=request.get("city", "Hyderabad"),
        pincode=request.get("pincode"),
        latitude=request.get("latitude"),
        longitude=request.get("longitude"),
        search_radius_km=request.get("search_radius_km", 3),
    )
    db.add(student)
    db.commit()
    token = create_token(student.id, "student")
    return {"message": "Student registered successfully", "id": student.id, "token": token}


# ============ DASHBOARD ENDPOINTS ============
@app.get("/api/dashboard/teacher")
def teacher_dashboard(db: Session = Depends(get_db), payload: dict = Depends(verify_token)):
    if payload["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Forbidden")

    teacher_id = payload["user_id"]
    teacher = db.query(Teacher).filter_by(id=teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    requests = db.query(TuitionRequest).filter_by(teacher_id=teacher_id).order_by(
        TuitionRequest.created_at.desc()).all()

    pending = [r for r in requests if r.status == "pending"]
    accepted = [r for r in requests if r.status == "accepted"]

    reviews = db.query(Review).filter_by(teacher_id=teacher_id).order_by(
        Review.created_at.desc()).limit(10).all()

    return {
        "profile": {
            "id": teacher.id, "name": teacher.name, "phone": teacher.phone,
            "rating": teacher.rating, "total_students": teacher.total_students,
            "is_verified": teacher.is_verified,
            "subjects": json.loads(teacher.subjects) if teacher.subjects else [],
            "area": teacher.area, "fee_per_hour": teacher.fee_per_hour,
        },
        "stats": {
            "total_requests": len(requests),
            "pending": len(pending),
            "accepted": len(accepted),
        },
        "pending_requests": [{
            "id": r.id, "request_id": r.request_id,
            "student_name": r.student.name if r.student else "",
            "student_phone": r.student.phone if r.student else "",
            "subject": r.subject, "message": r.message,
            "preferred_time": r.preferred_time,
            "preferred_days": r.preferred_days,
            "teaching_mode": r.teaching_mode,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        } for r in pending],
        "recent_reviews": [{
            "id": rv.id, "rating": rv.rating,
            "review_text": rv.review_text,
            "student_name": rv.student.name if rv.student else "Anonymous",
            "created_at": rv.created_at.isoformat() if rv.created_at else ""
        } for rv in reviews]
    }


@app.get("/api/dashboard/student")
def student_dashboard(db: Session = Depends(get_db), payload: dict = Depends(verify_token)):
    if payload["role"] != "student":
        raise HTTPException(status_code=403, detail="Forbidden")

    student_id = payload["user_id"]
    student = db.query(Student).filter_by(id=student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    requests = db.query(TuitionRequest).filter_by(student_id=student_id).order_by(
        TuitionRequest.created_at.desc()).all()

    return {
        "profile": {
            "id": student.id, "name": student.name, "phone": student.phone,
            "current_class": student.current_class,
            "subjects_needed": json.loads(student.subjects_needed) if student.subjects_needed else [],
            "area": student.area,
        },
        "requests": [{
            "id": r.id, "request_id": r.request_id,
            "teacher_name": r.teacher.name if r.teacher else "",
            "teacher_phone": r.teacher.phone if r.teacher else "",
            "subject": r.subject, "message": r.message,
            "status": r.status,
            "teacher_response": r.teacher_response,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        } for r in requests]
    }


# ============ TUITION REQUEST ENDPOINTS ============
@app.post("/api/requests")
def create_request(request: dict, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y%m%d")
    count = db.query(TuitionRequest).filter(
        TuitionRequest.request_id.like(f"NT-{today}%")
    ).count() + 1
    request_id = f"NT-{today}-{count:03d}"

    student = db.query(Student).filter_by(phone=request.get("phone")).first()
    if not student:
        student = Student(
            name=request.get("student_name", ""),
            phone=request.get("phone"),
            password_hash=hash_password("password123"),
            area=request.get("area", ""),
            city="Hyderabad"
        )
        db.add(student)
        db.commit()
        db.refresh(student)

    tuition_req = TuitionRequest(
        request_id=request_id,
        student_id=student.id,
        teacher_id=request.get("teacher_id"),
        subject=request.get("subject"),
        message=request.get("message", ""),
        preferred_time=request.get("preferred_time", ""),
        preferred_days=request.get("preferred_days", ""),
        teaching_mode=request.get("teaching_mode", "home_visit"),
        status="pending"
    )
    db.add(tuition_req)
    db.commit()
    return {"message": "Request sent successfully!", "request_id": request_id}


@app.get("/api/requests")
def get_all_requests(teacher_id: int = None, student_id: int = None,
                     status: str = None, db: Session = Depends(get_db)):
    query = db.query(TuitionRequest)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if student_id:
        query = query.filter_by(student_id=student_id)
    if status:
        query = query.filter_by(status=status)

    requests = query.order_by(TuitionRequest.created_at.desc()).all()
    return [{
        "id": r.id,
        "request_id": r.request_id,
        "student_name": r.student.name if r.student else "",
        "student_phone": r.student.phone if r.student else "",
        "teacher_name": r.teacher.name if r.teacher else "",
        "teacher_id": r.teacher_id,
        "subject": r.subject,
        "message": r.message,
        "preferred_time": r.preferred_time,
        "preferred_days": r.preferred_days,
        "teaching_mode": r.teaching_mode,
        "status": r.status,
        "teacher_response": r.teacher_response,
        "created_at": r.created_at.isoformat() if r.created_at else ""
    } for r in requests]


@app.put("/api/requests/{request_id}/respond")
def respond_to_request(request_id: str, request: dict, db: Session = Depends(get_db),
                       payload: dict = Depends(verify_token)):
    tuition_req = db.query(TuitionRequest).filter_by(request_id=request_id).first()
    if not tuition_req:
        raise HTTPException(status_code=404, detail="Request not found")

    if payload["role"] != "teacher" or payload["user_id"] != tuition_req.teacher_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    tuition_req.status = request.get("status")
    tuition_req.teacher_response = request.get("response_message", "")
    db.commit()
    return {"message": f"Request {tuition_req.status}"}


# ============ REVIEWS ============
@app.post("/api/reviews")
def create_review(request: dict, db: Session = Depends(get_db),
                  payload: dict = Depends(verify_token)):
    if payload["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can leave reviews")

    teacher = db.query(Teacher).filter_by(id=request.get("teacher_id")).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    review = Review(
        teacher_id=request.get("teacher_id"),
        student_id=payload["user_id"],
        rating=request.get("rating"),
        review_text=request.get("review_text", "")
    )
    db.add(review)

    # Update teacher average rating
    all_reviews = db.query(Review).filter_by(teacher_id=teacher.id).all()
    avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews) if all_reviews else request.get("rating")
    # Include new review in calculation
    total = len(all_reviews) + 1
    avg_rating = (sum(r.rating for r in all_reviews) + request.get("rating")) / total
    teacher.rating = round(avg_rating, 1)

    db.commit()
    return {"message": "Review submitted successfully"}


@app.get("/api/reviews/{teacher_id}")
def get_reviews(teacher_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter_by(teacher_id=teacher_id).order_by(
        Review.created_at.desc()).all()
    return [{
        "id": r.id, "rating": r.rating,
        "review_text": r.review_text,
        "student_name": r.student.name if r.student else "Anonymous",
        "created_at": r.created_at.isoformat() if r.created_at else ""
    } for r in reviews]


# ============ DASHBOARD STATS ============
@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "total_teachers": db.query(Teacher).filter_by(is_active=True).count(),
        "total_students": db.query(Student).filter_by(is_active=True).count(),
        "total_requests": db.query(TuitionRequest).count(),
        "pending_requests": db.query(TuitionRequest).filter_by(status="pending").count(),
        "accepted_requests": db.query(TuitionRequest).filter_by(status="accepted").count(),
    }


# ============ SUBJECTS / CLASSES ============
@app.get("/api/subjects")
def get_subjects():
    return [
        "Maths", "Physics", "Chemistry", "Biology",
        "English", "Hindi", "Telugu", "Social Studies",
        "Computer Science", "Accountancy", "Economics",
        "IIT-JEE", "NEET", "EAMCET"
    ]


@app.get("/api/classes")
def get_classes():
    return [
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
        "Class 11", "Class 12", "IIT-JEE Prep", "NEET Prep", "EAMCET Prep"
    ]


# ============ SERVE FRONTEND ============
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")


# ============ RUN SERVER ============
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
