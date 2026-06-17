import shutil
import os

src_dir = r"C:\Users\User\Desktop\Cube books\cubebook\frontend\src\pages"
dst_dir = r"C:\Users\User\Desktop\dinesh-tex\dinesh-tex\frontend\src\finance_module\pages"

print("Copying uncorrupted pages from:", src_dir)
if os.path.exists(dst_dir):
    shutil.rmtree(dst_dir)

shutil.copytree(src_dir, dst_dir)
print("Successfully restored uncorrupted pages.")
