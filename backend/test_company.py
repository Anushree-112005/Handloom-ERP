import requests

try:
    res = requests.post("http://127.0.0.1:8000/api/finance/api/companies/", json={
        "name": "Dinesh Exports",
        "legal_name": "Dinesh Exports",
        "maintain_inventory": True
    })
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
