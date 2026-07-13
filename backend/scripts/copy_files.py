import shutil
import os

backend_src = r"C:\Users\User\Desktop\dinesh-tex\dinesh-tex\backend\cubebook-back\app"
backend_dst = r"C:\Users\User\Desktop\dinesh-tex\dinesh-tex\backend\app\cubebook"

frontend_src = r"C:\Users\User\Desktop\dinesh-tex\dinesh-tex\frontend\cubebook-front\src"
frontend_dst = r"C:\Users\User\Desktop\dinesh-tex\dinesh-tex\frontend\src\finance_module"

print("Copying backend files...")
if not os.path.exists(backend_dst):
    shutil.copytree(backend_src, backend_dst)
else:
    print(f"Backend destination {backend_dst} already exists.")

print("Copying frontend files...")
if not os.path.exists(frontend_dst):
    shutil.copytree(frontend_src, frontend_dst)
else:
    print(f"Frontend destination {frontend_dst} already exists.")

print("Done.")
