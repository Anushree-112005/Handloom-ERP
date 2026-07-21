import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.security import get_password_hash

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)

users_data = [
    ("EMP001", "Dinesh Kumar R", "Managing Director", "Administration", "Super Admin", "dinesh.admin", "dinesh@dineshexports.com", "9876543210", "01-01-2024"),
    ("EMP002", "Priya Venkatesan", "Senior Merchandiser", "Order Management", "Merchandiser", "priya.merch", "priya@dineshexports.com", "9865321470", "15-03-2024"),
    ("EMP003", "Karthik Subramanian", "Senior Accountant", "Accounts & Finance", "Accountant", "karthik.accounts", "karthik@dineshexports.com", "9789456123", "10-02-2024"),
    ("EMP004", "Mohan Raj S", "Store & Yarn Manager", "Inventory & Warehousing", "Store Manager", "mohan.store", "mohan@dineshexports.com", "9944778855", "20-01-2024"),
    ("EMP005", "Saravanan K", "Quality Control Inspector", "Quality Control", "QC Inspector", "saravanan.qc", "saravanan@dineshexports.com", "9843216789", "05-04-2024"),
    ("EMP006", "Muthu Kumar V", "Security Supervisor", "Gate & Security", "Gate Staff", "muthu.gate", "muthu@dineshexports.com", "9791234567", "12-01-2024"),
    ("EMP007", "Anitha Ramesh", "HR Manager", "Human Resources", "HR Manager", "anitha.hr", "anitha@dineshexports.com", "9962345678", "08-02-2024"),
    ("EMP008", "Bala Murugan T", "Production Planner", "Production Planning", "PPC Planner", "bala.ppc", "bala@dineshexports.com", "9884567123", "18-03-2024"),
    ("EMP009", "Ravi Shankar P", "Packing & Dispatch Executive", "Packing / Sales & Dispatch", "Packing Staff", "ravi.packing", "ravi@dineshexports.com", "9787654321", "22-04-2024"),
    ("EMP010", "Divya Lakshmi N", "Export Documentation Executive", "Sales & Dispatch (Export Desk)", "Export Staff", "divya.export", "divya@dineshexports.com", "9678123456", "01-05-2024"),
]

async def seed():
    # 1. Add username column if not exists in a separate transaction
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE employees ADD COLUMN username VARCHAR(100) UNIQUE;"))
            print("Added 'username' column to employees table.")
        except Exception as e:
            print("Column 'username' might already exist.")
            
    # Fix NULL values caused by raw SQL inserts to prevent Pydantic 500 errors
    async with engine.begin() as conn:
        await conn.execute(text("""
            UPDATE employees SET 
                basic_salary = COALESCE(basic_salary, 0.0),
                hra = COALESCE(hra, 0.0),
                da = COALESCE(da, 0.0),
                allowances = COALESCE(allowances, 0.0),
                deductions = COALESCE(deductions, 0.0),
                pf_esi_percent = COALESCE(pf_esi_percent, 0.0),
                canteen = COALESCE(canteen, false),
                transport = COALESCE(transport, false),
                accommodation = COALESCE(accommodation, false),
                biometric_link = COALESCE(biometric_link, false)
            WHERE basic_salary IS NULL OR canteen IS NULL;
        """))
        print("Fixed NULL values in employees table.")
            
    # 2. Insert users in a new transaction
    async with engine.begin() as conn:
        print("Seeding 10 users...")
        for emp_id, name, desig, dept, role, username, email, phone, doj in users_data:
            # Check if user already exists
            res = await conn.execute(text("SELECT id FROM employees WHERE employee_code = :code"), {"code": emp_id})
            existing = res.scalar()
            
            pwd_hash = get_password_hash("password123")  # Temporary password
            
            if existing:
                await conn.execute(
                    text("""
                        UPDATE employees SET 
                            name = :name, designation = :desig, department = :dept, 
                            user_type = :role, username = :username, email = :email, 
                            mobile = :phone, date_of_joining = :doj,
                            password_hash = :pwd, status = 'Active',
                            basic_salary = COALESCE(basic_salary, 0.0),
                            canteen = COALESCE(canteen, false),
                            transport = COALESCE(transport, false),
                            accommodation = COALESCE(accommodation, false),
                            biometric_link = COALESCE(biometric_link, false)
                        WHERE employee_code = :code
                    """),
                    {
                        "name": name, "desig": desig, "dept": dept, "role": role,
                        "username": username, "email": email, "phone": phone,
                        "doj": doj, "pwd": pwd_hash, "code": emp_id
                    }
                )
                print(f"Updated user: {name} ({username})")
            else:
                await conn.execute(
                    text("""
                        INSERT INTO employees (
                            employee_code, name, designation, department, 
                            user_type, username, email, mobile, date_of_joining,
                            password_hash, status, basic_salary, hra, da, allowances, 
                            deductions, pf_esi_percent, canteen, transport, accommodation, biometric_link
                        ) VALUES (
                            :code, :name, :desig, :dept, :role, :username, :email, :phone, :doj, :pwd, 'Active',
                            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, false, false, false, false
                        )
                    """),
                    {
                        "code": emp_id, "name": name, "desig": desig, "dept": dept, 
                        "role": role, "username": username, "email": email, "phone": phone,
                        "doj": doj, "pwd": pwd_hash
                    }
                )
                print(f"Inserted user: {name} ({username})")

    print("User Seeding Completed successfully! Default password is 'password123'.")

if __name__ == "__main__":
    asyncio.run(seed())
