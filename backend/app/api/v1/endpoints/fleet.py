"""Fleet Management API endpoints for vehicle operations."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.service_schedule import ServiceSchedule
from app.models.maintenance_log import MaintenanceLog
from app.models.breakdown_entry import BreakdownEntry
from app.models.fuel_entry import FuelEntry
from app.models.fleet_document import FleetDocument
from app.models.route_trip import Route, Trip

# ── Schemas ────────────────────────────────────────────────────────────────
from pydantic import BaseModel


class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str = "TIPPER"
    make: str
    model: str
    year_of_manufacture: Optional[int] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    capacity_tons: Optional[float] = None
    rc_number: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[str] = None
    fitness_expiry: Optional[str] = None
    permit_expiry: Optional[str] = None
    pollution_expiry: Optional[str] = None
    current_mileage: Optional[float] = 0
    status: str = "ACTIVE"


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year_of_manufacture: Optional[int] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    capacity_tons: Optional[float] = None
    rc_number: Optional[str] = None
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[str] = None
    fitness_expiry: Optional[str] = None
    permit_expiry: Optional[str] = None
    pollution_expiry: Optional[str] = None
    current_mileage: Optional[float] = None
    status: Optional[str] = None


class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: str
    make: str
    model: str
    year_of_manufacture: Optional[int]
    chassis_number: Optional[str]
    engine_number: Optional[str]
    capacity_tons: Optional[float]
    rc_number: Optional[str]
    insurance_number: Optional[str]
    insurance_expiry: Optional[str]
    fitness_expiry: Optional[str]
    permit_expiry: Optional[str]
    pollution_expiry: Optional[str]
    current_mileage: float
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FleetStatsResponse(BaseModel):
    total_vehicles: int
    active_trips: int
    fuel_cost_today: float
    breakdown_vehicles: int
    expiring_documents: int
    total_drivers: int
    completed_trips_today: int
    total_revenue: float
    idle_vehicles: int
    stopped_vehicles: int
    recent_activities: List = []


router = APIRouter(prefix="/fleet", tags=["Fleet Management"])


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/vehicles", response_model=List[VehicleResponse])
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    """Get all vehicles."""
    result = await db.execute(select(Vehicle).order_by(Vehicle.vehicle_number))
    vehicles = result.scalars().all()
    return vehicles


@router.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(
    vehicle: VehicleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new vehicle."""
    # Check if vehicle_number already exists
    existing = await db.execute(
        select(Vehicle).where(Vehicle.vehicle_number == vehicle.vehicle_number)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle with number {vehicle.vehicle_number} already exists"
        )
    
    new_vehicle = Vehicle(**vehicle.model_dump())
    db.add(new_vehicle)
    await db.commit()
    await db.refresh(new_vehicle)
    return new_vehicle


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific vehicle by ID."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return vehicle


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_update: VehicleUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a vehicle."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if vehicle_number is being changed to an existing number
    if vehicle_update.vehicle_number and vehicle_update.vehicle_number != vehicle.vehicle_number:
        existing = await db.execute(
            select(Vehicle).where(Vehicle.vehicle_number == vehicle_update.vehicle_number)
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=400,
                detail=f"Vehicle with number {vehicle_update.vehicle_number} already exists"
            )
    
    # Update fields
    update_data = vehicle_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(vehicle, field, value)
    
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a vehicle."""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db.delete(vehicle)
    await db.commit()
    
    return {"message": "Vehicle deleted successfully"}


@router.get("/stats", response_model=FleetStatsResponse)
async def get_fleet_stats(db: AsyncSession = Depends(get_db)):
    """Get fleet dashboard statistics."""
    result = await db.execute(select(func.count(Vehicle.id)))
    total_vehicles = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Vehicle.id)).where(Vehicle.status == "ACTIVE")
    )
    active_vehicles = result.scalar() or 0
    
    # Mock data for now - in production, integrate with GPS/tracking system
    stats = FleetStatsResponse(
        total_vehicles=total_vehicles,
        active_trips=0,
        fuel_cost_today=0.0,
        breakdown_vehicles=0,
        expiring_documents=0,
        total_drivers=0,
        completed_trips_today=0,
        total_revenue=0.0,
        idle_vehicles=0,
        stopped_vehicles=0,
        recent_activities=[]
    )
    
    return stats


# ── Driver Schemas ────────────────────────────────────────────────────────────

class DriverCreate(BaseModel):
    driver_name: str
    driver_license: str
    license_expiry_date: str
    phone_number: str
    address: Optional[str] = None
    years_of_experience: Optional[int] = 0
    status: str = "Active"
    qualification: str = "HMV"
    aadhar_number: Optional[str] = None
    emergency_contact: Optional[str] = None


class DriverUpdate(BaseModel):
    driver_name: Optional[str] = None
    driver_license: Optional[str] = None
    license_expiry_date: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    years_of_experience: Optional[int] = None
    status: Optional[str] = None
    qualification: Optional[str] = None
    aadhar_number: Optional[str] = None
    emergency_contact: Optional[str] = None


class DriverResponse(BaseModel):
    id: int
    driver_name: str
    driver_license: str
    license_expiry_date: Optional[str]
    phone_number: str
    address: Optional[str]
    years_of_experience: int
    status: str
    qualification: str
    aadhar_number: Optional[str]
    emergency_contact: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Driver Endpoints ────────────────────────────────────────────────────────

@router.get("/drivers", response_model=List[DriverResponse])
async def list_drivers(db: AsyncSession = Depends(get_db)):
    """Get all drivers."""
    result = await db.execute(select(Driver).order_by(Driver.driver_name))
    drivers = result.scalars().all()
    return drivers


@router.post("/drivers", response_model=DriverResponse)
async def create_driver(driver: DriverCreate, db: AsyncSession = Depends(get_db)):
    """Create a new driver."""
    existing = await db.execute(select(Driver).where(Driver.driver_license == driver.driver_license))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Driver with this license already exists")
    
    new_driver = Driver(**driver.model_dump())
    db.add(new_driver)
    await db.commit()
    await db.refresh(new_driver)
    return new_driver


@router.put("/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: int, driver_update: DriverUpdate, db: AsyncSession = Depends(get_db)):
    """Update a driver."""
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    update_data = driver_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(driver, field, value)
    
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return driver


@router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a driver."""
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    db.delete(driver)
    await db.commit()
    return {"message": "Driver deleted successfully"}


# ── Service Schedule Schemas ──────────────────────────────────────────────────

class ServiceScheduleCreate(BaseModel):
    vehicle_id: int
    scheduled_date: str
    service_type: str
    status: str = "Pending"
    service_provider: Optional[str] = None
    estimated_cost: Optional[float] = 0
    notes: Optional[str] = None


class ServiceScheduleResponse(BaseModel):
    id: int
    vehicle_id: int
    scheduled_date: str
    service_type: str
    status: str
    service_provider: Optional[str]
    estimated_cost: float
    notes: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Service Schedule Endpoints ────────────────────────────────────────────────

@router.get("/service-schedules", response_model=List[ServiceScheduleResponse])
async def list_service_schedules(db: AsyncSession = Depends(get_db)):
    """Get all service schedules."""
    result = await db.execute(select(ServiceSchedule).order_by(ServiceSchedule.scheduled_date))
    schedules = result.scalars().all()
    return schedules


@router.post("/service-schedules", response_model=ServiceScheduleResponse)
async def create_service_schedule(schedule: ServiceScheduleCreate, db: AsyncSession = Depends(get_db)):
    """Create a new service schedule."""
    new_schedule = ServiceSchedule(**schedule.model_dump())
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    return new_schedule


@router.put("/service-schedules/{schedule_id}", response_model=ServiceScheduleResponse)
async def update_service_schedule(schedule_id: int, schedule_update: ServiceScheduleCreate, db: AsyncSession = Depends(get_db)):
    """Update a service schedule."""
    result = await db.execute(select(ServiceSchedule).where(ServiceSchedule.id == schedule_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    update_data = schedule_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule


@router.delete("/service-schedules/{schedule_id}")
async def delete_service_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a service schedule."""
    result = await db.execute(select(ServiceSchedule).where(ServiceSchedule.id == schedule_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db.delete(schedule)
    await db.commit()
    return {"message": "Schedule deleted successfully"}


# ── Maintenance Log Schemas ───────────────────────────────────────────────────

class MaintenanceLogCreate(BaseModel):
    vehicle_id: int
    service_date: str
    maintenance_type: str
    work_description: Optional[str] = None
    labor_cost: Optional[float] = 0
    parts_cost: Optional[float] = 0
    status: str = "In Progress"


class MaintenanceLogResponse(BaseModel):
    id: int
    vehicle_id: int
    service_date: str
    maintenance_type: str
    work_description: Optional[str]
    labor_cost: float
    parts_cost: float
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Maintenance Log Endpoints ─────────────────────────────────────────────────

@router.get("/maintenance-logs", response_model=List[MaintenanceLogResponse])
async def list_maintenance_logs(db: AsyncSession = Depends(get_db)):
    """Get all maintenance logs."""
    result = await db.execute(select(MaintenanceLog).order_by(MaintenanceLog.service_date.desc()))
    logs = result.scalars().all()
    return logs


@router.post("/maintenance-logs", response_model=MaintenanceLogResponse)
async def create_maintenance_log(log: MaintenanceLogCreate, db: AsyncSession = Depends(get_db)):
    """Create a new maintenance log."""
    new_log = MaintenanceLog(**log.model_dump())
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    return new_log


@router.put("/maintenance-logs/{log_id}", response_model=MaintenanceLogResponse)
async def update_maintenance_log(log_id: int, log_update: MaintenanceLogCreate, db: AsyncSession = Depends(get_db)):
    """Update a maintenance log."""
    result = await db.execute(select(MaintenanceLog).where(MaintenanceLog.id == log_id))
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    update_data = log_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)
    
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/maintenance-logs/{log_id}")
async def delete_maintenance_log(log_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a maintenance log."""
    result = await db.execute(select(MaintenanceLog).where(MaintenanceLog.id == log_id))
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    await db.commit()
    return {"message": "Log deleted successfully"}


# ── Breakdown Entry Schemas ───────────────────────────────────────────────────

class BreakdownEntryCreate(BaseModel):
    vehicle_id: int
    breakdown_date: str
    location: str
    issue_description: str
    repair_required: Optional[str] = None
    status: str = "Reported"
    resolution_time_hours: Optional[float] = 0
    assistance_type: str = "Roadside Assistance"


class BreakdownEntryResponse(BaseModel):
    id: int
    vehicle_id: int
    breakdown_date: str
    location: str
    issue_description: str
    repair_required: Optional[str]
    status: str
    resolution_time_hours: float
    assistance_type: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Breakdown Entry Endpoints ─────────────────────────────────────────────────

@router.get("/breakdowns", response_model=List[BreakdownEntryResponse])
async def list_breakdowns(db: AsyncSession = Depends(get_db)):
    """Get all breakdown entries."""
    result = await db.execute(select(BreakdownEntry).order_by(BreakdownEntry.breakdown_date.desc()))
    entries = result.scalars().all()
    return entries


@router.post("/breakdowns", response_model=BreakdownEntryResponse)
async def create_breakdown(entry: BreakdownEntryCreate, db: AsyncSession = Depends(get_db)):
    """Create a new breakdown entry."""
    new_entry = BreakdownEntry(**entry.model_dump())
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    return new_entry


@router.put("/breakdowns/{entry_id}", response_model=BreakdownEntryResponse)
async def update_breakdown(entry_id: int, entry_update: BreakdownEntryCreate, db: AsyncSession = Depends(get_db)):
    """Update a breakdown entry."""
    result = await db.execute(select(BreakdownEntry).where(BreakdownEntry.id == entry_id))
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    update_data = entry_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/breakdowns/{entry_id}")
async def delete_breakdown(entry_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a breakdown entry."""
    result = await db.execute(select(BreakdownEntry).where(BreakdownEntry.id == entry_id))
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    await db.commit()
    return {"message": "Entry deleted successfully"}


# ── Fuel Entry Schemas ─────────────────────────────────────────────────────────

class FuelEntryCreate(BaseModel):
    vehicle_id: int
    entry_date: str
    odometer_reading: float
    fuel_quantity: float
    fuel_cost: float
    fuel_type: str = "Diesel"
    fuel_station: Optional[str] = None
    notes: Optional[str] = None


class FuelEntryResponse(BaseModel):
    id: int
    vehicle_id: int
    entry_date: str
    odometer_reading: float
    fuel_quantity: float
    fuel_cost: float
    fuel_type: str
    fuel_station: Optional[str]
    notes: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Fuel Entry Endpoints ───────────────────────────────────────────────────────

@router.get("/fuel-entries", response_model=List[FuelEntryResponse])
async def list_fuel_entries(db: AsyncSession = Depends(get_db)):
    """Get all fuel entries."""
    result = await db.execute(select(FuelEntry).order_by(FuelEntry.entry_date.desc()))
    entries = result.scalars().all()
    return entries


@router.post("/fuel-entries", response_model=FuelEntryResponse)
async def create_fuel_entry(entry: FuelEntryCreate, db: AsyncSession = Depends(get_db)):
    """Create a new fuel entry."""
    new_entry = FuelEntry(**entry.model_dump())
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    return new_entry


@router.put("/fuel-entries/{entry_id}", response_model=FuelEntryResponse)
async def update_fuel_entry(entry_id: int, entry_update: FuelEntryCreate, db: AsyncSession = Depends(get_db)):
    """Update a fuel entry."""
    result = await db.execute(select(FuelEntry).where(FuelEntry.id == entry_id))
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    update_data = entry_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/fuel-entries/{entry_id}")
async def delete_fuel_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a fuel entry."""
    result = await db.execute(select(FuelEntry).where(FuelEntry.id == entry_id))
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    await db.commit()
    return {"message": "Entry deleted successfully"}


# ── Fleet Document Schemas ────────────────────────────────────────────────────

class FleetDocumentCreate(BaseModel):
    vehicle_id: int
    document_type: str
    document_name: Optional[str] = None
    document_path: Optional[str] = None
    expiry_date: Optional[str] = None
    issued_date: Optional[str] = None
    authority: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class FleetDocumentResponse(BaseModel):
    id: int
    vehicle_id: int
    document_type: str
    document_name: Optional[str]
    document_path: Optional[str]
    expiry_date: Optional[str]
    issued_date: Optional[str]
    authority: Optional[str]
    reference_number: Optional[str]
    notes: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Fleet Expiry Alert Schemas ────────────────────────────────────────────────

class ExpiryAlertResponse(BaseModel):
    id: Optional[int] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    document_type: str
    document_number: Optional[str] = None
    expiry_date: str
    days_remaining: int
    status: str
    is_blocking: bool
    data_source: str

    class Config:
        from_attributes = True


# ── Fleet Expiry Alert Endpoints ──────────────────────────────────────────────

@router.get("/expiry-alerts", response_model=List[ExpiryAlertResponse])
async def list_expiry_alerts(db: AsyncSession = Depends(get_db)):
    """Get all compliance and document expiry alerts."""
    import datetime
    today = datetime.date.today()
    
    # 1. Fetch all vehicles
    vehicles_res = await db.execute(select(Vehicle))
    vehicles = vehicles_res.scalars().all()
    vehicle_map = {v.id: v.vehicle_number for v in vehicles}
    
    # 2. Fetch all drivers
    drivers_res = await db.execute(select(Driver))
    drivers = drivers_res.scalars().all()
    
    # 3. Fetch all fleet documents
    docs_res = await db.execute(select(FleetDocument))
    documents = docs_res.scalars().all()
    
    alerts = []
    
    def parse_date(date_str):
        if not date_str:
            return None
        date_str = str(date_str).strip()
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y"):
            try:
                # remove time suffix if present
                clean_str = date_str.split("T")[0].split(" ")[0]
                return datetime.datetime.strptime(clean_str, fmt).date()
            except ValueError:
                continue
        return None
        
    def add_alert(expiry_str, doc_type, doc_num, source, v_num=None, d_name=None, doc_id=None):
        if not expiry_str:
            return
        exp_date = parse_date(expiry_str)
        if not exp_date:
            return
        
        days_rem = (exp_date - today).days
        if days_rem < 0:
            status = "Expired"
        elif days_rem <= 30:
            status = "Expiring Soon"
        else:
            status = "Valid"
            
        is_blocking = (status == "Expired")
        
        alerts.append({
            "id": doc_id,
            "vehicle_number": v_num,
            "driver_name": d_name,
            "document_type": doc_type,
            "document_number": doc_num,
            "expiry_date": exp_date.isoformat(),
            "days_remaining": days_rem,
            "status": status,
            "is_blocking": is_blocking,
            "data_source": source
        })

    # Add vehicle documents
    for v in vehicles:
        add_alert(v.insurance_expiry, "Insurance", v.insurance_number, "Vehicle", v_num=v.vehicle_number)
        add_alert(v.fitness_expiry, "Fitness Certificate", None, "Vehicle", v_num=v.vehicle_number)
        add_alert(v.permit_expiry, "Permit", None, "Vehicle", v_num=v.vehicle_number)
        add_alert(v.pollution_expiry, "Pollution (PUC)", None, "Vehicle", v_num=v.vehicle_number)
        
    # Add driver license expirations
    for d in drivers:
        add_alert(d.license_expiry_date, "Driver License", d.driver_license, "Driver", d_name=d.driver_name)
        
    # Add general fleet documents
    for doc in documents:
        v_num = vehicle_map.get(doc.vehicle_id)
        add_alert(doc.expiry_date, doc.document_type, doc.reference_number, "Compliance", v_num=v_num, doc_id=doc.id)
        
    # Sort alerts by days_remaining ascending (most urgent first)
    alerts.sort(key=lambda x: x["days_remaining"])
    
    return alerts


# ── Fleet Document Endpoints ──────────────────────────────────────────────────

@router.get("/documents", response_model=List[FleetDocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    """Get all fleet documents."""
    result = await db.execute(select(FleetDocument).order_by(FleetDocument.document_type))
    documents = result.scalars().all()
    return documents


@router.post("/documents", response_model=FleetDocumentResponse)
async def create_document(doc: FleetDocumentCreate, db: AsyncSession = Depends(get_db)):
    """Create a new fleet document."""
    new_doc = FleetDocument(**doc.model_dump())
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc


@router.put("/documents/{doc_id}", response_model=FleetDocumentResponse)
async def update_document(doc_id: int, doc_update: FleetDocumentCreate, db: AsyncSession = Depends(get_db)):
    """Update a fleet document."""
    result = await db.execute(select(FleetDocument).where(FleetDocument.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = doc_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doc, field, value)
    
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a fleet document."""
    result = await db.execute(select(FleetDocument).where(FleetDocument.id == doc_id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}


# ── Route Schemas ─────────────────────────────────────────────────────────────

class RouteCreate(BaseModel):
    route_name: str
    origin: str
    destination: str
    distance_km: Optional[float] = None
    estimated_duration_hours: Optional[float] = None
    route_type: str = "Regular"
    status: str = "Active"


class RouteResponse(BaseModel):
    id: int
    route_name: str
    origin: str
    destination: str
    distance_km: Optional[float]
    estimated_duration_hours: Optional[float]
    route_type: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Route Endpoints ───────────────────────────────────────────────────────────

@router.get("/routes", response_model=List[RouteResponse])
async def list_routes(db: AsyncSession = Depends(get_db)):
    """Get all routes."""
    result = await db.execute(select(Route).order_by(Route.route_name))
    routes = result.scalars().all()
    return routes


@router.post("/routes", response_model=RouteResponse)
async def create_route(route: RouteCreate, db: AsyncSession = Depends(get_db)):
    """Create a new route."""
    new_route = Route(**route.model_dump())
    db.add(new_route)
    await db.commit()
    await db.refresh(new_route)
    return new_route


@router.put("/routes/{route_id}", response_model=RouteResponse)
async def update_route(route_id: int, route_update: RouteCreate, db: AsyncSession = Depends(get_db)):
    """Update a route."""
    result = await db.execute(select(Route).where(Route.id == route_id))
    route = result.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    update_data = route_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(route, field, value)
    
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return route


@router.delete("/routes/{route_id}")
async def delete_route(route_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a route."""
    result = await db.execute(select(Route).where(Route.id == route_id))
    route = result.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    db.delete(route)
    await db.commit()
    return {"message": "Route deleted successfully"}


# ── Trip Schemas ──────────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    route_id: Optional[int] = None
    trip_date: str
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    odometer_start: Optional[float] = None
    odometer_end: Optional[float] = None
    fuel_used: Optional[float] = None
    status: str = "Planned"
    revenue: Optional[float] = 0
    expenses: Optional[float] = 0
    notes: Optional[str] = None


class TripResponse(BaseModel):
    id: int
    vehicle_id: int
    driver_id: Optional[int]
    route_id: Optional[int]
    trip_date: str
    start_location: Optional[str]
    end_location: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    odometer_start: Optional[float]
    odometer_end: Optional[float]
    fuel_used: Optional[float]
    status: str
    revenue: float
    expenses: float
    notes: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Trip Endpoints ────────────────────────────────────────────────────────────

@router.get("/trips", response_model=List[TripResponse])
async def list_trips(db: AsyncSession = Depends(get_db)):
    """Get all trips."""
    result = await db.execute(select(Trip).order_by(Trip.trip_date.desc()))
    trips = result.scalars().all()
    return trips


@router.post("/trips", response_model=TripResponse)
async def create_trip(trip: TripCreate, db: AsyncSession = Depends(get_db)):
    """Create a new trip."""
    new_trip = Trip(**trip.model_dump())
    db.add(new_trip)
    await db.commit()
    await db.refresh(new_trip)
    return new_trip


@router.put("/trips/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: int, trip_update: TripCreate, db: AsyncSession = Depends(get_db)):
    """Update a trip."""
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    update_data = trip_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)
    
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a trip."""
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db.delete(trip)
    await db.commit()
    return {"message": "Trip deleted successfully"}


@router.get("/driver-performance-report")
async def driver_performance_report(
    driver_id: Optional[int] = None,
    vehicle_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch drivers and vehicles
    drivers_query = select(Driver)
    if driver_id:
        drivers_query = drivers_query.where(Driver.id == driver_id)
    drivers_res = await db.execute(drivers_query)
    drivers = drivers_res.scalars().all()
    driver_map = {d.id: d for d in drivers}

    vehicles_query = select(Vehicle)
    if vehicle_id:
        vehicles_query = vehicles_query.where(Vehicle.id == vehicle_id)
    vehicles_res = await db.execute(vehicles_query)
    vehicles = vehicles_res.scalars().all()
    vehicle_map = {v.id: v for v in vehicles}

    # 2. Fetch all trips
    trips_query = select(Trip)
    if driver_id:
        trips_query = trips_query.where(Trip.driver_id == driver_id)
    if vehicle_id:
        trips_query = trips_query.where(Trip.vehicle_id == vehicle_id)
    
    trips_res = await db.execute(trips_query)
    all_trips = trips_res.scalars().all()

    filtered_trips = []
    for t in all_trips:
        if not t.trip_date:
            continue
        try:
            clean_date = t.trip_date.split("T")[0].split(" ")[0]
            if start_date and clean_date < start_date:
                continue
            if end_date and clean_date > end_date:
                continue
        except Exception:
            pass
        filtered_trips.append(t)

    # 3. Fetch all fuel entries and breakdown entries
    fuel_res = await db.execute(select(FuelEntry))
    fuel_entries = fuel_res.scalars().all()

    breakdown_res = await db.execute(select(BreakdownEntry))
    breakdown_entries = breakdown_res.scalars().all()

    details = []
    
    # Calculate driver stats
    for d in drivers:
        d_trips = [t for t in filtered_trips if t.driver_id == d.id]
        if not d_trips and not driver_id:
            continue
        
        driver_vehicle_ids = list(set([t.vehicle_id for t in d_trips if t.vehicle_id]))
        vehicle_nums = [vehicle_map[vid].vehicle_number for vid in driver_vehicle_ids if vid in vehicle_map]
        vehicle_num_str = ", ".join(vehicle_nums) if vehicle_nums else "None"
        
        total_trips = len(d_trips)
        completed_trips = len([t for t in d_trips if t.status == "Completed"])
        on_time_deliveries = completed_trips
        
        total_distance = 0.0
        total_driving_time = 0.0
        for t in d_trips:
            if t.odometer_end and t.odometer_start and t.odometer_end > t.odometer_start:
                total_distance += (t.odometer_end - t.odometer_start)
            else:
                total_distance += 150.0
            total_driving_time += 4.5
            
        breakdowns = 0
        for b in breakdown_entries:
            if b.vehicle_id in driver_vehicle_ids:
                breakdowns += 1
                
        d_fuel_cost = 0.0
        d_fuel_qty = 0.0
        for f in fuel_entries:
            if f.vehicle_id in driver_vehicle_ids:
                d_fuel_cost += f.fuel_cost
                d_fuel_qty += f.fuel_quantity
                
        if d_fuel_qty == 0:
            d_fuel_qty = total_distance / 4.5
            d_fuel_cost = d_fuel_qty * 95.0
            
        avg_mileage = round(total_distance / d_fuel_qty, 2) if d_fuel_qty > 0 else 4.5
        cost_per_km = round(d_fuel_cost / total_distance, 2) if total_distance > 0 else 21.1
        
        on_time_rate = (on_time_deliveries / total_trips) if total_trips > 0 else 1.0
        score = int(on_time_rate * 70 + (avg_mileage / 6.0) * 20 - (breakdowns * 10))
        score = max(55, min(98, score))
        
        status = "High Performance" if score >= 85 else "Average" if score >= 70 else "Low Performance"
        
        recent_trips = []
        for t in d_trips[:5]:
            v_num = vehicle_map[t.vehicle_id].vehicle_number if t.vehicle_id in vehicle_map else "Unknown"
            recent_trips.append({
                "date": t.trip_date,
                "vehicle_number": v_num,
                "driver_name": d.driver_name,
                "distance": round(t.odometer_end - t.odometer_start, 1) if (t.odometer_end and t.odometer_start and t.odometer_end > t.odometer_start) else 150.0,
                "fuel_liters": round(t.fuel_used, 1) if t.fuel_used else 33.3,
                "fuel_cost": round(t.fuel_used * 95.0, 2) if t.fuel_used else 3163.5
            })
            
        details.append({
            "driver_name": d.driver_name,
            "vehicle_number": vehicle_num_str,
            "status": status,
            "total_trips": total_trips,
            "on_time_deliveries": on_time_deliveries,
            "total_driving_time": round(total_driving_time, 1),
            "total_distance": round(total_distance, 1),
            "avg_mileage": avg_mileage,
            "cost_per_km": cost_per_km,
            "fuel_cost": round(d_fuel_cost, 2),
            "performance_score": score,
            "breakdowns": breakdowns,
            "recent_trips": recent_trips
        })

    # Add vehicle details
    for v in vehicles:
        v_trips = [t for t in filtered_trips if t.vehicle_id == v.id]
        if not v_trips and not vehicle_id:
            continue
        
        driver_names = [driver_map[t.driver_id].driver_name for t in v_trips if t.driver_id and t.driver_id in driver_map]
        driver_name_str = ", ".join(list(set(driver_names))) if driver_names else "None"
        
        total_trips = len(v_trips)
        completed_trips = len([t for t in v_trips if t.status == "Completed"])
        on_time_deliveries = completed_trips
        
        total_distance = 0.0
        total_driving_time = 0.0
        for t in v_trips:
            if t.odometer_end and t.odometer_start and t.odometer_end > t.odometer_start:
                total_distance += (t.odometer_end - t.odometer_start)
            else:
                total_distance += 150.0
            total_driving_time += 4.5
            
        breakdowns = len([b for b in breakdown_entries if b.vehicle_id == v.id])
        
        v_fuel_cost = sum([f.fuel_cost for f in fuel_entries if f.vehicle_id == v.id])
        v_fuel_qty = sum([f.fuel_quantity for f in fuel_entries if f.vehicle_id == v.id])
        
        if v_fuel_qty == 0:
            v_fuel_qty = total_distance / 4.5
            v_fuel_cost = v_fuel_qty * 95.0
            
        avg_mileage = round(total_distance / v_fuel_qty, 2) if v_fuel_qty > 0 else 4.5
        cost_per_km = round(v_fuel_cost / total_distance, 2) if total_distance > 0 else 21.1
        
        on_time_rate = (on_time_deliveries / total_trips) if total_trips > 0 else 1.0
        score = int(on_time_rate * 70 + (avg_mileage / 6.0) * 20 - (breakdowns * 10))
        score = max(55, min(98, score))
        
        status = "High Performance" if score >= 85 else "Average" if score >= 70 else "Low Performance"
        
        recent_trips = []
        for t in v_trips[:5]:
            d_name = driver_map[t.driver_id].driver_name if (t.driver_id and t.driver_id in driver_map) else "Unknown"
            recent_trips.append({
                "date": t.trip_date,
                "vehicle_number": v.vehicle_number,
                "driver_name": d_name,
                "distance": round(t.odometer_end - t.odometer_start, 1) if (t.odometer_end and t.odometer_start and t.odometer_end > t.odometer_start) else 150.0,
                "fuel_liters": round(t.fuel_used, 1) if t.fuel_used else 33.3,
                "fuel_cost": round(t.fuel_used * 95.0, 2) if t.fuel_used else 3163.5
            })
            
        details.append({
            "driver_name": driver_name_str,
            "vehicle_number": v.vehicle_number,
            "status": status,
            "total_trips": total_trips,
            "on_time_deliveries": on_time_deliveries,
            "total_driving_time": round(total_driving_time, 1),
            "total_distance": round(total_distance, 1),
            "avg_mileage": avg_mileage,
            "cost_per_km": cost_per_km,
            "fuel_cost": round(v_fuel_cost, 2),
            "performance_score": score,
            "breakdowns": breakdowns,
            "recent_trips": recent_trips
        })

    details.sort(key=lambda x: x["performance_score"], reverse=True)

    best_performer = "N/A"
    if details:
        best_performer = details[0]["driver_name"] if details[0]["driver_name"] != "None" else details[0]["vehicle_number"]

    summary = {
        "best_performer": best_performer
    }

    return {
        "summary": summary,
        "details": details
    }
