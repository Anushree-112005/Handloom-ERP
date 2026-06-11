import requests
res = requests.post("http://localhost:8000/api/companies/1/seed-vouchers")
print(res.status_code)
print(res.text)
