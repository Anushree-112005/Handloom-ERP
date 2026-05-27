import requests
import json

payload = {
      "ibpo": None,
      "po_date": None,
      "ref_no": "16763",
      "planning_date": "2023-10-10",
      "billing_party": None,
      "delivery_party": None,
      "billing_address": None,
      "delivery_address": None,
      "state_code": None,
      "design_no": None,
      "pino": None,
      "order_qty": 0,
      "amd_foc_mtr": 0,
      "total_qty": 0,
      "uom": "Meters",
      "delivery_start": None,
      "party_comp_date": None,
      "comp_date": None,
      "lc_no": None,
      "lc_date": None,
      "ibpo_rate": 0,
      "currency": "INR",
      "certificate_type": None,
      "fabric_type": None,
      "planned_mtrs": 0,
      "tolerance_pct": 0,
      "max_dispatch_qty": 0,
      "stock": 0,
      "tot_desp_mtrs": 0,
      "balance_mtrs": 0,
      "last_desp_date": None,
      "merchant": None,
      "point_of_contact": None,
      "remarks": "{}",
      "status": "Planned"
}

res = requests.post("http://127.0.0.1:8000/api/v1/despatch-planning/", json=payload)
print(res.status_code)
print(res.text)
