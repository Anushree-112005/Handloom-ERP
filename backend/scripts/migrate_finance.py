import os
import shutil
import re

ROOT = r"C:\Users\User\Desktop\dinesh-tex\dinesh-tex"
BACKEND_SRC = os.path.join(ROOT, r"backend\cubebook-back\app")
BACKEND_DST = os.path.join(ROOT, r"backend\app\cubebook")
FRONTEND_SRC = os.path.join(ROOT, r"frontend\cubebook-front\src")
FRONTEND_DST = os.path.join(ROOT, r"frontend\src\finance_module")

def copy_files():
    print("Copying backend files...")
    if not os.path.exists(BACKEND_DST):
        shutil.copytree(BACKEND_SRC, BACKEND_DST)
    
    print("Copying frontend files...")
    if not os.path.exists(FRONTEND_DST):
        shutil.copytree(FRONTEND_SRC, FRONTEND_DST)

def update_backend_database():
    db_file = os.path.join(BACKEND_DST, "database.py")
    if os.path.exists(db_file):
        with open(db_file, "r") as f:
            content = f.read()
        # Replace postgres URL with sqlite URL
        content = re.sub(
            r'SQLALCHEMY_DATABASE_URL\s*=\s*".*?"',
            'SQLALCHEMY_DATABASE_URL = "sqlite:///./cubebook.db"',
            content
        )
        with open(db_file, "w") as f:
            f.write(content)
        print("Updated backend database.py to use SQLite.")

def update_backend_main():
    main_file = os.path.join(ROOT, r"backend\app\main.py")
    if os.path.exists(main_file):
        with open(main_file, "r") as f:
            content = f.read()
        
        if "from app.cubebook.main import app as finance_app" not in content:
            mount_code = "\n# Mount Finance Module\nfrom app.cubebook.main import app as finance_app\napp.mount('/api/finance', finance_app)\n"
            content += mount_code
            with open(main_file, "w") as f:
                f.write(content)
            print("Mounted /api/finance in backend/app/main.py")

def update_frontend_api():
    api_file = os.path.join(FRONTEND_DST, "api", "index.js")
    if os.path.exists(api_file):
        with open(api_file, "r") as f:
            content = f.read()
        
        # Replace specific URL or local URL logic
        content = re.sub(
            r"const API_URL\s*=\s*'.*?';",
            "const API_URL = '/api/finance';",
            content
        )
        content = re.sub(
            r'const API_URL\s*=\s*".*?";',
            'const API_URL = "/api/finance";',
            content
        )
        with open(api_file, "w") as f:
            f.write(content)
        print("Updated API base URL in frontend.")

def update_frontend_app():
    # We will replace CubeBookPage.jsx instead of fully refactoring App.jsx right now.
    # The cubebook App.jsx will be rendered inside CubeBookPage.jsx.
    cube_page = os.path.join(ROOT, r"frontend\src\pages\cubebook\CubeBookPage.jsx")
    if os.path.exists(cube_page):
        content = """import React from 'react';
import FinanceApp from '../../finance_module/App';

export default function CubeBookPage() {
  return (
    <div className="cubebook-native-wrapper" style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <FinanceApp />
    </div>
  );
}
"""
        with open(cube_page, "w") as f:
            f.write(content)
        print("Updated CubeBookPage.jsx to render FinanceApp natively.")

if __name__ == "__main__":
    try:
        copy_files()
        update_backend_database()
        update_backend_main()
        update_frontend_api()
        update_frontend_app()
        print("\nAll integration tasks completed successfully! You can restart your servers.")
    except Exception as e:
        print(f"Error during migration: {e}")
