from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pycountry

from app.core.database import get_db
from app.models.party_master import PartyMaster
from app.models.employee import Employee
from app.models.sub_master import SubMaster

router = APIRouter(prefix="/dropdowns", tags=["Dropdowns"])

INDIAN_STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", 
    "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", 
    "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", 
    "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

WORLD_COUNTRIES = ["India"] + sorted([c.name for c in pycountry.countries if c.name != "India"])

TAMIL_NADU_DISTRICTS = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", 
    "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", 
    "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", 
    "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", 
    "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", 
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", 
    "Viluppuram", "Virudhunagar"
]

OTHER_DISTRICTS = {
    "Mumbai": "Maharashtra",
    "Pune": "Maharashtra",
    "Nagpur": "Maharashtra",
    "Surat": "Gujarat",
    "Ahmedabad": "Gujarat",
    "Vadodara": "Gujarat",
    "Bangalore": "Karnataka",
    "Mysore": "Karnataka",
    "Kochi": "Kerala",
    "Trivandrum": "Kerala",
    "New Delhi": "Delhi"
}

DEFAULT_SUB_MASTERS = {
    "party_type": [],
    "customer_grade": ["A", "B", "C"],
    "party_type_group": [],
    "state_master": INDIAN_STATES,
    "district_city_master": TAMIL_NADU_DISTRICTS + list(OTHER_DISTRICTS.keys()),
    "sales_region_master": ["South Zone", "North Zone", "Export", "Local"],
    "country_master": WORLD_COUNTRIES,
    "currency_master": ["INR", "USD", "EUR"],
    "gst_type_master": ["With GST", "Without GST"],
    "tds_master": ["None", "194C", "194Q"],
    "tcs_master": ["Yes", "No"],
    "uom_master": ["Meters", "Yards", "Kgs", "Rolls", "Pieces"],
    "payment_terms_master": ["30 Days", "45 Days", "60 Days", "90 Days", "Cash"],
    "agent_master": ["Self", "Local Agent", "Direct Agent"],
    "yarn_spec_type_master": ["Warp", "Weft"],
    "order_type_master": ["Domestic", "Export"]
}

@router.get("/")
async def get_all_dropdowns(db: AsyncSession = Depends(get_db)):
    # 1. Fetch dynamic parties
    parties_req = await db.execute(select(PartyMaster.id, PartyMaster.company_name, PartyMaster.party_type))
    parties = parties_req.all()
    
    agents = [{"id": p.id, "name": p.company_name} for p in parties if p.party_type and "Agent" in p.party_type]
    transporters = [{"id": p.id, "name": p.company_name} for p in parties if p.party_type and "Logistics" in p.party_type]
    all_parties = [{"id": p.id, "name": p.company_name} for p in parties]

    # 2. Fetch employees for Manager, Merchandiser, A/c Incharge
    emp_req = await db.execute(select(Employee.id, Employee.name, Employee.department))
    employees = [{"id": e.id, "name": e.name, "department": e.department} for e in emp_req.all()]

    # 3. Auto-seed missing sub-masters if not already seeded
    seeded_check = await db.execute(select(SubMaster).where(SubMaster.entity == "system_seeded"))
    has_seeded = seeded_check.scalars().first() is not None
    
    if not has_seeded:
        added_any = False
        for entity, values in DEFAULT_SUB_MASTERS.items():
            check_req = await db.execute(select(SubMaster).where(SubMaster.entity == entity))
            existing_rows = check_req.scalars().all()
            if not existing_rows:
                for val in values:
                    extra_1 = None
                    if entity == "district_city_master":
                        if val in TAMIL_NADU_DISTRICTS:
                            extra_1 = "Tamil Nadu"
                        elif val in OTHER_DISTRICTS:
                            extra_1 = OTHER_DISTRICTS[val]
                    db.add(SubMaster(entity=entity, name=val, is_active=True, extra_field_1=extra_1))
                    added_any = True
        
        # Add metadata row to indicate system has seeded defaults
        db.add(SubMaster(entity="system_seeded", name="initialized", is_active=True))
        db.add(SubMaster(entity="system_seeded", name="states_countries_seeded", is_active=True))
        db.add(SubMaster(entity="system_seeded", name="districts_seeded", is_active=True))
        added_any = True
        
        if added_any:
            await db.commit()
    else:
        # One-time migration for existing databases: check if states/countries have been seeded
        states_countries_check = await db.execute(
            select(SubMaster).where(SubMaster.entity == "system_seeded", SubMaster.name == "states_countries_seeded")
        )
        has_seeded_states_countries = states_countries_check.scalars().first() is not None
        
        if not has_seeded_states_countries:
            added_any = False
            for entity in ["state_master", "country_master"]:
                check_req = await db.execute(select(SubMaster).where(SubMaster.entity == entity))
                existing_rows = check_req.scalars().all()
                if not existing_rows:
                    for val in DEFAULT_SUB_MASTERS[entity]:
                        db.add(SubMaster(entity=entity, name=val, is_active=True))
                        added_any = True
            
            db.add(SubMaster(entity="system_seeded", name="states_countries_seeded", is_active=True))
            added_any = True
            
            if added_any:
                await db.commit()

        # One-time migration for existing databases: check if districts have been seeded
        districts_seeded_check = await db.execute(
            select(SubMaster).where(SubMaster.entity == "system_seeded", SubMaster.name == "districts_seeded")
        )
        has_seeded_districts = districts_seeded_check.scalars().first() is not None
        
        if not has_seeded_districts:
            added_any = False
            for val in TAMIL_NADU_DISTRICTS + list(OTHER_DISTRICTS.keys()):
                check_exist = await db.execute(
                    select(SubMaster).where(SubMaster.entity == "district_city_master", SubMaster.name == val)
                )
                if not check_exist.scalars().first():
                    extra_1 = "Tamil Nadu" if val in TAMIL_NADU_DISTRICTS else OTHER_DISTRICTS[val]
                    db.add(SubMaster(entity="district_city_master", name=val, is_active=True, extra_field_1=extra_1))
                    added_any = True
            
            db.add(SubMaster(entity="system_seeded", name="districts_seeded", is_active=True))
            added_any = True
            
            if added_any:
                await db.commit()

        # One-time migration for existing databases: check if yarn_spec_type_master has been seeded
        yarn_spec_check = await db.execute(
            select(SubMaster).where(SubMaster.entity == "system_seeded", SubMaster.name == "yarn_spec_type_seeded")
        )
        has_seeded_yarn_spec = yarn_spec_check.scalars().first() is not None
        
        if not has_seeded_yarn_spec:
            added_any = False
            for val in ["Warp", "Weft"]:
                check_exist = await db.execute(
                    select(SubMaster).where(SubMaster.entity == "yarn_spec_type_master", SubMaster.name == val)
                )
                if not check_exist.scalars().first():
                    db.add(SubMaster(entity="yarn_spec_type_master", name=val, is_active=True))
                    added_any = True
            db.add(SubMaster(entity="system_seeded", name="yarn_spec_type_seeded", is_active=True))
            added_any = True
            if added_any:
                await db.commit()

        # One-time migration for existing databases: check if order_type_master has been seeded
        order_type_check = await db.execute(
            select(SubMaster).where(SubMaster.entity == "system_seeded", SubMaster.name == "order_type_seeded")
        )
        has_seeded_order_type = order_type_check.scalars().first() is not None
        
        if not has_seeded_order_type:
            added_any = False
            for val in ["Domestic", "Export"]:
                check_exist = await db.execute(
                    select(SubMaster).where(SubMaster.entity == "order_type_master", SubMaster.name == val)
                )
                if not check_exist.scalars().first():
                    db.add(SubMaster(entity="order_type_master", name=val, is_active=True))
                    added_any = True
            db.add(SubMaster(entity="system_seeded", name="order_type_seeded", is_active=True))
            added_any = True
            if added_any:
                await db.commit()

    # 4. Fetch all active sub-masters (excluding system markers)
    sm_req = await db.execute(
        select(SubMaster.id, SubMaster.entity, SubMaster.name, SubMaster.code, SubMaster.extra_field_1)
        .where(SubMaster.is_active == True, SubMaster.entity != "system_seeded")
    )
    sm_rows = sm_req.all()

    # Build masters_with_ids: { entity: [{id, name, code, extra_field_1}, ...] }
    masters_with_ids = {}
    for r in sm_rows:
        if r.entity not in masters_with_ids:
            masters_with_ids[r.entity] = []
        masters_with_ids[r.entity].append({
            "id": r.id,
            "name": r.name,
            "code": r.code or "",
            "extra_field_1": r.extra_field_1 or ""
        })

    # Categories mapping to build simple list masters for frontend backwards compatibility
    categories_mapping = {
        "party_type": "party_type",
        "customer_grade": "customer_grade",
        "party_type_group": "party_group",
        "state_master": "state",
        "district_city_master": "district",  # maps to both district and city
        "sales_region_master": "sales_region",
        "country_master": "country",
        "currency_master": "currency",
        "gst_type_master": "gst_type",
        "tds_master": "tds",
        "tcs_master": "tcs_applicable",
        "uom_master": "uom_master",
        "payment_terms_master": "payment_terms",
        "transport_name_master": "transport_name_master",
        "agent_master": "agent_master",
        "address_sno_master": "address_sno",
        "order_type_master": "order_type_master",
        "certified_type": "certified_type",
        "commission_type_master": "commission_type_master",
        "regular_special_master": "regular_special_master",
        "status_master": "status_master",
        "fabric_type_master": "fabric_type_master",
        "weaving_type_master": "weaving_type_master",
        "pattern_master": "pattern_master",
        "packing_type_master": "packing_type_master",
        "end_use_master": "end_use_master",
        "season_master": "season_master",
        "transport_mode_master": "transport_mode_master",
        "process_sequence_master": "process_sequence_master",
        "color_master": "color_master",
        "hsn_code_master": "hsn_code_master",
        "lr_type_master": "lr_type_master",
        "lr_terms": "lr_terms",
        "buyer": "buyer",
        "party_terms_master": "party_terms_master",
        "organization_name_master": "organization_name_master",
        "against_reference_master": "against_reference_master",
        "freight_type_master": "freight_type_master",
        "mill_name_master": "mill_name_master",
        "yarn_count_master": "yarn_count_master",
        "cone_type_master": "cone_type_master",
        "received_type_master": "received_type_master",
        "yarn_type_master": "yarn_type_master",
        "design_no_master": "design_no_master",
        "inv_mode_master": "inv_mode_master",
        "approval_status_master": "approval_status_master",
        "dis_no_master": "dis_no_master",
        "delivery_at_master": "delivery_at_master",
        "freight_mode_master": "freight_mode_master",
        "bale_type_master": "bale_type_master",
        "payment_mode_master": "payment_mode_master",
        "invoice_type_master": "invoice_type_master",
        "pin_master": "pin_master",
        "bale_list_master": "bale_list_master",
        "stock_type_master": "stock_type_master",
        "godown_master": "godown_master",
        "unit_master": "unit_master",
        "yarn_spec_type_master": "yarn_spec_type_master"
    }

    masters = {}
    for cat in categories_mapping.values():
        masters[cat] = []
    masters["city"] = []
    masters["district"] = []

    for r in sm_rows:
        cat = categories_mapping.get(r.entity)
        if cat:
            val = r.name
            if r.entity == "hsn_code_master":
                val = r.code if r.code else r.name
            
            if r.entity == "district_city_master":
                masters["city"].append(val)
                masters["district"].append(val)
            else:
                masters[cat].append(val)

    # Sort everything unique (India first for country)
    for cat in list(masters.keys()):
        if cat == "country":
            countries_list = list(set(masters[cat]))
            has_india = "India" in countries_list
            other_countries = sorted([c for c in countries_list if c != "India"])
            masters[cat] = ["India"] + other_countries if has_india else other_countries
        else:
            masters[cat] = sorted(list(set(masters[cat])))

    # Make sure masters_with_ids has all entities defined as lists and sort them
    for entity in DEFAULT_SUB_MASTERS.keys():
        if entity not in masters_with_ids:
            masters_with_ids[entity] = []

    for entity, item_list in masters_with_ids.items():
        if entity == "country_master":
            item_list.sort(key=lambda x: (0 if x["name"] == "India" else 1, x["name"]))
        else:
            item_list.sort(key=lambda x: x["name"])

    return {
        "agents": agents,
        "transporters": transporters,
        "all_parties": all_parties,
        "employees": employees,
        "masters": masters,
        "masters_with_ids": masters_with_ids
    }
