from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, unique=True, index=True, nullable=False)
    asset_type = Column(String, nullable=False)
    name = Column(String, nullable=True)
    region = Column(String, nullable=True)
    account_id = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    is_encrypted = Column(Boolean, default=False)
    tags = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Asset {self.asset_id}>"
