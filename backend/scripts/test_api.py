import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

# 1. Fetch existing POs
try:
    response = requests.get(f"{BASE_URL}/warping-sizing-po/")
    print("GET POs Status:", response.status_code)
    existing = response.json()
    print("Number of existing POs:", len(existing))
except Exception as e:
    print("Error fetching POs:", e)

# 2. Create a test PO
payload = {
    "po_no": "TEST-WSPO-99999",
    "po_date": "2026-07-08",
    "status": "Active",
    "items": [
        # Yarn item
        {
            "yarn_count": "40S CTN",
            "shade": "Cream",
            "uom": "Cone",
            "yarn_code": "2610",
            "qty_kg": 101.400,
            "lot_no": "2630.000",
            "yarn_type": "Warp Beam1",
            "weaver_name": "",
            "no_of_beam": 0
        },
        # Weaver item
        {
            "yarn_count": "",
            "shade": "",
            "uom": "",
            "yarn_code": "",
            "qty_kg": 0,
            "lot_no": "",
            "yarn_type": "",
            "weaver_name": "Test Job Worker",
            "no_of_beam": 2
        }
    ]
}

try:
    response = requests.post(f"{BASE_URL}/warping-sizing-po/", json=payload)
    print("POST Create PO Status:", response.status_code)
    if response.status_code != 200:
        print("Create Error Detail:", response.text)
    else:
        created = response.json()
        created_id = created.get("id")
        print("Created PO ID:", created_id)

        # 3. Get the PO list to verify items
        response = requests.get(f"{BASE_URL}/warping-sizing-po/")
        all_pos = response.json()
        my_po = next((po for po in all_pos if po.get("id") == created_id), None)
        if my_po:
            print("PO Items retrieved:", my_po.get("items"))
            
            # 4. Clean up / Delete the test PO
            response = requests.delete(f"{BASE_URL}/warping-sizing-po/{created_id}")
            print("DELETE PO Status:", response.status_code)
except Exception as e:
    print("Error during operations:", e)
