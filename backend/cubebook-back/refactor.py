import os
import shutil

def main():
    backend_dir = r"c:\Users\User\Desktop\Cube books\cubebook\backend"
    os.chdir(backend_dir)
    os.makedirs("app", exist_ok=True)

    print("Updating import statements in Python files...")
    # 1. Update imports in all Python files
    for root, _, files in os.walk("."):
        if "app" in root or "__pycache__" in root:
            continue
        for file in files:
            if file.endswith(".py") and file != "refactor.py":
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                content = content.replace("from database import", "from app.database import")
                content = content.replace("from models.", "from app.models.")
                content = content.replace("from routers import", "from app.routers import")
                content = content.replace("from schemas import", "from app.schemas import")
                content = content.replace("from scripts.", "from app.scripts.")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)

    print("Moving files and directories into app/ ...")
    # 2. Move files and folders
    items_to_move = ["database.py", "main.py", "models", "routers", "schemas", "scripts"]
    for item in items_to_move:
        if os.path.exists(item):
            shutil.move(item, os.path.join("app", item))

    print("Updating start_backend.bat...")
    # 3. Update start_backend.bat
    bat_path = r"c:\Users\User\Desktop\Cube books\cubebook\start_backend.bat"
    if os.path.exists(bat_path):
        with open(bat_path, "r", encoding="utf-8") as f:
            bat_content = f.read()
        bat_content = bat_content.replace("python -m uvicorn backend.main:app", "python -m uvicorn backend.app.main:app")
        with open(bat_path, "w", encoding="utf-8") as f:
            f.write(bat_content)

    print("Updating pyproject.toml...")
    # 4. Update pyproject.toml
    toml_path = r"c:\Users\User\Desktop\Cube books\cubebook\pyproject.toml"
    if os.path.exists(toml_path):
        with open(toml_path, "r", encoding="utf-8") as f:
            toml_content = f.read()
        toml_content = toml_content.replace('search_path = ["backend"]', 'search_path = ["backend/app"]')
        with open(toml_path, "w", encoding="utf-8") as f:
            f.write(toml_content)

    print("Refactoring complete! You can now restart your Uvicorn server.")

if __name__ == "__main__":
    main()
