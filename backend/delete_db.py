import os
db_path = os.path.join(os.path.dirname(__file__), 'cubebook.db')
if os.path.exists(db_path):
    os.remove(db_path)
    print("Deleted cubebook.db")
else:
    print("cubebook.db not found")
