from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    email = Column(String(100))
    password_hash = Column(String(200))
    photo_url = Column(String(500))

    # Professional details
    qualification = Column(String(200))  # B.Tech, M.Sc, PhD
    experience_years = Column(Integer, default=0)
    category = Column(String(50), default="academics", index=True)  # academics, music, technology, languages, arts, competitive
    subjects = Column(Text)  # JSON: ["Maths", "Physics", "Chemistry"]
    classes = Column(Text)  # JSON: ["Class 9", "Class 10", "IIT-JEE"]
    teaching_mode = Column(String(50), default="both")  # home_visit, online, both
    bio = Column(Text)  # Short description about themselves

    # Location
    area = Column(String(100), index=True)  # Kukatpally, KPHB, Ameerpet
    city = Column(String(50), default="Hyderabad")
    pincode = Column(String(10))
    latitude = Column(Float)
    longitude = Column(Float)
    travel_radius_km = Column(Integer, default=5)  # Willing to travel this far

    # Pricing
    fee_per_hour = Column(Float, default=0)
    fee_per_month = Column(Float, default=0)

    # Availability
    available_days = Column(Text)  # JSON: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    available_time_from = Column(String(10), default="06:00")
    available_time_to = Column(String(10), default="21:00")

    # Status
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    rating = Column(Float, default=0)
    total_students = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    requests = relationship("TuitionRequest", back_populates="teacher")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Student or parent name
    phone = Column(String(15), unique=True, nullable=False)
    email = Column(String(100))
    password_hash = Column(String(200))

    # Student details
    student_name = Column(String(100))  # Actual student name if parent registers
    current_class = Column(String(50))  # Class 10, IIT-JEE Prep
    subjects_needed = Column(Text)  # JSON: ["Maths", "Physics"]
    learning_mode = Column(String(50), default="both")  # home_visit, online, both

    # Location
    area = Column(String(100))
    city = Column(String(50), default="Hyderabad")
    pincode = Column(String(10))
    latitude = Column(Float)
    longitude = Column(Float)
    search_radius_km = Column(Integer, default=3)

    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    requests = relationship("TuitionRequest", back_populates="student")


class TuitionRequest(Base):
    __tablename__ = "tuition_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(20), unique=True, nullable=False)  # NT-20260818-001
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)

    subject = Column(String(100), nullable=False)
    message = Column(Text)  # Student's message to teacher
    preferred_time = Column(String(100))  # "Evenings 5-7 PM"
    preferred_days = Column(String(200))  # "Mon, Wed, Fri"
    teaching_mode = Column(String(50))  # home_visit, online

    # Status: pending, accepted, rejected, cancelled, completed
    status = Column(String(20), default="pending")
    teacher_response = Column(Text)  # Teacher's reply message

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    student = relationship("Student", back_populates="requests")
    teacher = relationship("Teacher", back_populates="requests")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    review_text = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
