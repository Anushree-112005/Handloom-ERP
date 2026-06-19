from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.general_master import GeneralMaster
from app.models.party_master import PartyMaster
from app.models.employee import Employee

router = APIRouter(prefix="/dropdowns", tags=["Dropdowns"])

DEFAULT_MASTERS = {
    "party_type": [
        "Sales", "Purchase", "Sales Party", "Logistics", "Processor", "Yarn Dyeing", "Yarn Coverter",
        "Exports party", "Own Shed", "Washing/Finishing", "Purchase Party",
        "Agent", "Weaving vendor", "Bit Loom Weaver", "Doubling", "Weaving Unit",
        "Testing Lab", "Spares Supplier", "Delivery Party"
    ],
    "customer_grade": ["A", "B", "C"],
    "state": ["Tamil Nadu", "Maharashtra", "Karnataka", "Gujarat", "Kerala", "Delhi"],
    "district": ["Erode", "Namakkal", "Coimbatore", "Tiruppur", "Salem"],
    "city": ["Tiruchengodu", "Erode", "Coimbatore", "Mumbai", "Surat", "Ahmedabad"],
    "sales_region": ["South Zone", "North Zone", "Export", "Local"],
    "country": ["India", "Bangladesh", "USA", "UAE"],
    "currency": ["INR", "USD", "EUR"],
    "gst_type": ["With GST", "Without GST"],
    "tds": ["None", "194C", "194Q"],
    "uom_master": ["Meters", "Yards", "Kgs", "Rolls", "Pieces"],

}

@router.get("/")
async def get_all_dropdowns(db: AsyncSession = Depends(get_db)):
    # 1. Fetch dynamic parties
    parties_req = await db.execute(select(PartyMaster.id, PartyMaster.company_name, PartyMaster.party_type))
    parties = parties_req.all()
    
    agents = [{"id": p.id, "name": p.company_name} for p in parties if p.party_type == "Agent"]
    transporters = [{"id": p.id, "name": p.company_name} for p in parties if p.party_type == "Logistics"]
    all_parties = [{"id": p.id, "name": p.company_name} for p in parties]

    # 2. Fetch employees for Manager, Merchandiser, A/c Incharge
    emp_req = await db.execute(select(Employee.id, Employee.name, Employee.department))
    employees = [{"id": e.id, "name": e.name, "department": e.department} for e in emp_req.all()]

    # 3. Fetch General Masters
    gm_req = await db.execute(select(GeneralMaster.category, GeneralMaster.value))
    gm_rows = gm_req.all()
    
    # Auto-seed if empty or check and seed missing defaults
    existing_gm = {}
    for row in gm_rows:
        if row.category not in existing_gm:
            existing_gm[row.category] = set()
        existing_gm[row.category].add(row.value)

    added_any = False
    for category, values in DEFAULT_MASTERS.items():
        existing_vals = existing_gm.get(category, set())
        for val in values:
            if val not in existing_vals:
                db.add(GeneralMaster(category=category, value=val))
                added_any = True
                
    if added_any:
        await db.commit()
        gm_req = await db.execute(select(GeneralMaster.category, GeneralMaster.value))
        gm_rows = gm_req.all()

    # Group General Masters
    masters = {}
    for row in gm_rows:
        if row.category not in masters:
            masters[row.category] = []
        masters[row.category].append(row.value)

    # 4. Override with SubMasters (Core System Basic)
    from app.models.sub_master import SubMaster
    sm_req = await db.execute(select(SubMaster.entity, SubMaster.name, SubMaster.code, SubMaster.extra_field_1).where(SubMaster.is_active == True))
    sm_rows = sm_req.all()
    
    district_cities = [r.name for r in sm_rows if r.entity == "district_city_master"]
    states = list(set([r.extra_field_1 for r in sm_rows if r.entity == "district_city_master" and r.extra_field_1]))
    regions = [r.name for r in sm_rows if r.entity == "sales_region_master"]
    custom_currencies = [r.name for r in sm_rows if r.entity == "currency_master"]
    party_groups = [r.name for r in sm_rows if r.entity == "party_type_group"]
    custom_party_types = [r.name for r in sm_rows if r.entity == "party_type"]
    custom_customer_grades = [r.name for r in sm_rows if r.entity == "customer_grade"]
    custom_countries = [r.name for r in sm_rows if r.entity == "country_master"]
    custom_states = [r.name for r in sm_rows if r.entity == "state_master"]
    custom_gst_types = [r.name for r in sm_rows if r.entity == "gst_type_master"]
    custom_tds = [r.name for r in sm_rows if r.entity == "tds_master"]
    custom_tcs = [r.name for r in sm_rows if r.entity == "tcs_master"]
    custom_address_sno = [r.name for r in sm_rows if r.entity == "address_sno_master"]
    custom_payment_terms = [r.name for r in sm_rows if r.entity == "payment_terms_master"]
    custom_order_types = [r.name for r in sm_rows if r.entity == "order_type_master"]
    custom_certified_types = [r.name for r in sm_rows if r.entity == "certified_type"]
    custom_commission_types = [r.name for r in sm_rows if r.entity == "commission_type_master"]
    custom_regular_special = [r.name for r in sm_rows if r.entity == "regular_special_master"]
    custom_statuses = [r.name for r in sm_rows if r.entity == "status_master"]
    custom_fabric_types = [r.name for r in sm_rows if r.entity == "fabric_type_master"]
    custom_uom = [r.name for r in sm_rows if r.entity == "uom_master"]
    custom_weaving_types = [r.name for r in sm_rows if r.entity == "weaving_type_master"]
    custom_patterns = [r.name for r in sm_rows if r.entity == "pattern_master"]
    custom_packing_types = [r.name for r in sm_rows if r.entity == "packing_type_master"]
    custom_end_uses = [r.name for r in sm_rows if r.entity == "end_use_master"]
    custom_seasons = [r.name for r in sm_rows if r.entity == "season_master"]
    custom_transport_modes = [r.name for r in sm_rows if r.entity == "transport_mode_master"]
    custom_transport_names = [r.name for r in sm_rows if r.entity == "transport_name_master"]
    custom_process_sequences = [r.name for r in sm_rows if r.entity == "process_sequence_master"]
    custom_colors = [r.name for r in sm_rows if r.entity == "color_master"]
    custom_hsn_codes = [r.code if r.code else r.name for r in sm_rows if r.entity == "hsn_code_master"]
    custom_lr_types = [r.name for r in sm_rows if r.entity == "lr_type_master"]
    custom_lr_terms = [r.name for r in sm_rows if r.entity == "lr_terms"]
    custom_buyers = [r.name for r in sm_rows if r.entity == "buyer"]
    custom_party_terms = [r.name for r in sm_rows if r.entity == "party_terms_master"]
    custom_org_names = [r.name for r in sm_rows if r.entity == "organization_name_master"]
    custom_against_refs = [r.name for r in sm_rows if r.entity == "against_reference_master"]
    custom_freight_types = [r.name for r in sm_rows if r.entity == "freight_type_master"]
    custom_mill_names = [r.name for r in sm_rows if r.entity == "mill_name_master"]
    custom_yarn_counts = [r.name for r in sm_rows if r.entity == "yarn_count_master"]
    custom_cone_types = [r.name for r in sm_rows if r.entity == "cone_type_master"]
    custom_received_types = [r.name for r in sm_rows if r.entity == "received_type_master"]
    custom_yarn_types = [r.name for r in sm_rows if r.entity == "yarn_type_master"]
    custom_design_nos = [r.name for r in sm_rows if r.entity == "design_no_master"]

    custom_inv_modes = [r.name for r in sm_rows if r.entity == "inv_mode_master"]
    custom_approval_statuses = [r.name for r in sm_rows if r.entity == "approval_status_master"]
    custom_dis_nos = [r.name for r in sm_rows if r.entity == "dis_no_master"]
    custom_delivery_ats = [r.name for r in sm_rows if r.entity == "delivery_at_master"]
    custom_agents = [r.name for r in sm_rows if r.entity == "agent_master"]
    custom_freight_modes = [r.name for r in sm_rows if r.entity == "freight_mode_master"]
    custom_bale_types = [r.name for r in sm_rows if r.entity == "bale_type_master"]
    custom_payment_modes = [r.name for r in sm_rows if r.entity == "payment_mode_master"]
    custom_invoice_types = [r.name for r in sm_rows if r.entity == "invoice_type_master"]
    custom_units = [r.name for r in sm_rows if r.entity == "unit_master"]
    custom_pins = [r.name for r in sm_rows if r.entity == "pin_master"]
    custom_bale_lists = [r.name for r in sm_rows if r.entity == "bale_list_master"]
    custom_stock_types = [r.name for r in sm_rows if r.entity == "stock_type_master"]
    custom_godowns = [r.name for r in sm_rows if r.entity == "godown_master"]

    if district_cities:
        masters["city"] = district_cities
        masters["district"] = district_cities
        
    # Force Party Group to be strictly fetched from SubMaster only
    masters["party_group"] = party_groups
    
    masters["party_type"] = list(dict.fromkeys(custom_party_types))
    
    if custom_customer_grades:
        combined_grades = masters.get("customer_grade", []) + custom_customer_grades
        masters["customer_grade"] = list(dict.fromkeys(combined_grades))
        
    masters["gst_type"] = list(dict.fromkeys(masters.get("gst_type", []) + custom_gst_types))
    masters["tds"] = list(dict.fromkeys(masters.get("tds", []) + custom_tds))
    masters["tcs_applicable"] = list(dict.fromkeys(masters.get("tcs_applicable", ["Yes", "No"]) + custom_tcs))
    masters["address_sno"] = list(dict.fromkeys(masters.get("address_sno", []) + custom_address_sno))
    masters["payment_terms"] = custom_payment_terms
    masters["order_type_master"] = list(dict.fromkeys(custom_order_types))
    masters["certified_type"] = list(dict.fromkeys(custom_certified_types))
    masters["commission_type_master"] = list(dict.fromkeys(custom_commission_types))
    masters["regular_special_master"] = list(dict.fromkeys(custom_regular_special))
    masters["status_master"] = list(dict.fromkeys(custom_statuses))
    masters["fabric_type_master"] = list(dict.fromkeys(custom_fabric_types))
    masters["uom_master"] = list(dict.fromkeys(masters.get("uom_master", []) + custom_uom))
    masters["weaving_type_master"] = list(dict.fromkeys(custom_weaving_types))
    masters["pattern_master"] = list(dict.fromkeys(custom_patterns))
    masters["packing_type_master"] = list(dict.fromkeys(custom_packing_types))
    masters["end_use_master"] = list(dict.fromkeys(custom_end_uses))
    masters["season_master"] = list(dict.fromkeys(custom_seasons))
    masters["transport_mode_master"] = list(dict.fromkeys(custom_transport_modes))
    masters["transport_name_master"] = list(dict.fromkeys(custom_transport_names))
    masters["process_sequence_master"] = list(dict.fromkeys(custom_process_sequences))
    masters["color_master"] = list(dict.fromkeys(custom_colors))
    masters["hsn_code_master"] = list(dict.fromkeys(custom_hsn_codes))
    masters["lr_type_master"] = list(dict.fromkeys(custom_lr_types))
    masters["lr_terms"] = list(dict.fromkeys(custom_lr_terms))
    masters["buyer"] = list(dict.fromkeys(custom_buyers))
    masters["party_terms_master"] = list(dict.fromkeys(custom_party_terms))
    masters["organization_name_master"] = list(dict.fromkeys(custom_org_names))
    masters["against_reference_master"] = list(dict.fromkeys(custom_against_refs))
    masters["freight_type_master"] = list(dict.fromkeys(custom_freight_types))
    masters["mill_name_master"] = list(dict.fromkeys(custom_mill_names))
    masters["yarn_count_master"] = list(dict.fromkeys(custom_yarn_counts))
    masters["cone_type_master"] = list(dict.fromkeys(custom_cone_types))
    masters["received_type_master"] = list(dict.fromkeys(custom_received_types))
    masters["yarn_type_master"] = list(dict.fromkeys(custom_yarn_types))
    masters["design_no_master"] = list(dict.fromkeys(custom_design_nos))

    masters["inv_mode_master"] = list(dict.fromkeys(custom_inv_modes))
    masters["approval_status_master"] = list(dict.fromkeys(custom_approval_statuses))
    masters["dis_no_master"] = list(dict.fromkeys(custom_dis_nos))
    masters["delivery_at_master"] = list(dict.fromkeys(custom_delivery_ats))
    masters["agent_master"] = list(dict.fromkeys(custom_agents))
    masters["freight_mode_master"] = list(dict.fromkeys(custom_freight_modes))
    masters["bale_type_master"] = list(dict.fromkeys(custom_bale_types))
    masters["payment_mode_master"] = list(dict.fromkeys(custom_payment_modes))
    masters["invoice_type_master"] = list(dict.fromkeys(custom_invoice_types))
    masters["pin_master"] = list(dict.fromkeys(custom_pins))
    masters["bale_list_master"] = list(dict.fromkeys(custom_bale_lists))
    masters["stock_type_master"] = list(dict.fromkeys(custom_stock_types))
    masters["godown_master"] = list(dict.fromkeys(custom_godowns))
        
    INDIAN_STATES = [
        "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", 
        "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", 
        "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", 
        "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", 
        "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", 
        "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
        "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ]
    
    # Combine states from submaster with standard Indian states
    all_states = list(set(states + custom_states + INDIAN_STATES))
    masters["state"] = sorted(all_states)
    if regions:
        combined_regions = masters.get("sales_region", []) + regions
        masters["sales_region"] = list(dict.fromkeys(combined_regions))
        
    # 5. Add all world countries and currencies using pycountry package
    import pycountry
    # Put India first, then the rest
    all_countries = ["India"] + sorted([c.name for c in pycountry.countries if c.name != "India"])
    masters["country"] = list(dict.fromkeys(all_countries + custom_countries))
    
    # Extract alpha_3 currencies (e.g. INR, USD)
    standard_currencies = [c.alpha_3 for c in pycountry.currencies if hasattr(c, 'alpha_3')]
    all_currencies = list(set(standard_currencies + custom_currencies))
    
    # Sort and put INR, USD, EUR at the top
    all_currencies = sorted([c for c in all_currencies if c not in ["INR", "USD", "EUR"]])
    masters["currency"] = ["INR", "USD", "EUR"] + all_currencies

    return {
        "agents": agents,
        "transporters": transporters,
        "all_parties": all_parties,
        "employees": employees,
        "masters": masters
    }
