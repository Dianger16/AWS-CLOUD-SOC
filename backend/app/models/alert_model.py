from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False)
    source = Column(String, nullable=False)
    resource_id = Column(String, nullable=True)
    resource_type = Column(String, nullable=True)
    remediation_advice = Column(Text, nullable=True)
    is_acknowleged = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Alert {self.severity} - {self.title}>"