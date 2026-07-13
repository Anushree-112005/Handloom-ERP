import requests
import json

url = "http://localhost:8000/api/v1/design-entries/"

headers = {
    "Content-Type": "application/json"
}

# Create a long fabric_design_details array
fabric_design = []
for i in range(100):
    fabric_design.append({
        "type": "Warp beam1",
        "yarn_count": "2/40S CTN",
        "color": f"Meroon-{i}",
        "threads": i,
        "times": "1",
        "line": "Base",
        "pick": "",
        "drawing_order": "",
        "dents": "",
        "line_val": "",
        "ends_for_dents": f"id_{i}"
    })

payload = {
    "ds_date": "2026-07-10",
    "design_no": "TEST-LARGE-01",
    "color": "Meroon",
    "created_by": "System",
    "gry_const": "40x40/100x80",
    "count_rxpxw": "2/40s X 2/40s",
    "buyer_name": "Cauvery Textile Buyers Pvt Ltd",
    "ibpo_no": "IBPO-00002",
    "order_mtr": 5180.0,
    "ex_mtr": 50.0,
    "total_mtr": 5230.0,
    "crimp_pct": 7.0,
    "skg_pct": 8.1,
    "warp_mtr": 6050.0,
    "weft_pro_mtr": 5700.0,
    "gray_width": 59.5,
    "finish_width": 63.46,
    "reed_ol": 60.0,
    "pick_ot": 52.0,
    "reed": 6.0,
    "fabric": "Cotton",
    "total_ends": 381.0,
    "warp_width": 0.0,
    "qlm": 118.73,
    "toie_pct": 0.0,
    "selvage_waste": 3.0,
    "weaving": "Plain",
    "design_type": "Normal",
    "packing_less": 0.0,
    "weight_grm": 73.66,
    "dyeing_loss_pct": 5.0,
    "yarn_details": json.dumps([{"type": "Warp beam1", "yarn_count": "2/40S CTN", "act_count": "20", "ends": "", "crimp_pct": ""}]),
    "fabric_design_details": json.dumps(fabric_design),
    "warp_summary": "[]",
    "weft_summary": "[]",
    "book_no": "20",
    "page_no": "90"
}

resp = requests.post(url, json=payload, headers=headers)
print("Status Code:", resp.status_code)
try:
    print("Response JSON:", resp.json())
except Exception:
    print("Response Text:", resp.text)
