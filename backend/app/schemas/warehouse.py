from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WarehouseBinBase(BaseModel):
    name: str
    capacity: int = 0

class WarehouseBinCreate(WarehouseBinBase):
    pass

class WarehouseBin(WarehouseBinBase):
    id: int
    rack_id: int

    class Config:
        from_attributes = True

class WarehouseRackBase(BaseModel):
    name: str

class WarehouseRackCreate(WarehouseRackBase):
    pass

class WarehouseRack(WarehouseRackBase):
    id: int
    zone_id: int
    bins: List[WarehouseBin] = []

    class Config:
        from_attributes = True

class WarehouseZoneBase(BaseModel):
    name: str
    description: Optional[str] = None

class WarehouseZoneCreate(WarehouseZoneBase):
    pass

class WarehouseZone(WarehouseZoneBase):
    id: int
    warehouse_id: int
    racks: List[WarehouseRack] = []

    class Config:
        from_attributes = True

class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None
    type: str
    is_active: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class Warehouse(WarehouseBase):
    id: int
    created_at: datetime
    zones: List[WarehouseZone] = []

    class Config:
        from_attributes = True

class GodownSummary(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    type: str
    is_active: bool = True
    racks: int = 0
    bins: int = 0
    
    class Config:
        from_attributes = True

class WarehouseStagingBase(BaseModel):
    grn_number: Optional[str] = None
    vendor: Optional[str] = None
    item_description: Optional[str] = None
    received_qty: Optional[str] = None
    arrival_time: Optional[str] = None
    status: Optional[str] = "Awaiting QC"

class WarehouseStagingCreate(WarehouseStagingBase):
    pass

class WarehouseStaging(WarehouseStagingBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class WarehousePutAwayBase(BaseModel):
    task_id: Optional[str] = None
    source_grn: Optional[str] = None
    item_details: Optional[str] = None
    quantity: Optional[str] = None
    suggested_location: Optional[str] = None
    actual_location: Optional[str] = None
    status: Optional[str] = "Pending"

class WarehousePutAwayCreate(WarehousePutAwayBase):
    pass

class WarehousePutAway(WarehousePutAwayBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class WarehousePickListBase(BaseModel):
    pick_list_id: Optional[str] = None
    reference_doc: Optional[str] = None
    item_to_pick: Optional[str] = None
    quantity: Optional[str] = None
    source_location: Optional[str] = None
    status: Optional[str] = "Pending"

class WarehousePickListCreate(WarehousePickListBase):
    pass

class WarehousePickList(WarehousePickListBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
