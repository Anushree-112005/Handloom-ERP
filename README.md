# Dinesh Textile ERP

Dinesh Textile ERP is a comprehensive, production-grade enterprise resource planning application designed for external job work, fabric receipt, design management, fleet tracking, and gate security registers for the textile manufacturing industry.

---

## 🚀 Getting Started

This repository contains two main sub-projects:
- `frontend/` — Built using React, Vite, and TailwindCSS.
- `backend/` — Powered by FastAPI (Python), SQLite (for local database), and SQLAlchemy.

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)

---

## 🛠️ Installation & Execution

### 1. Backend Setup (FastAPI)
1. Navigate into the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server using Uvicorn:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *The backend documentation will be accessible at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 2. Frontend Setup (React + Vite)
1. Navigate into the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web app will run locally at [http://localhost:5173](http://localhost:5173).*

---

## 📁 Key Directories & Modules

```
├── backend/
│   ├── app/                 # FastAPI routes, models, schemas, and services
│   ├── uploads/             # Tracked directory structure for file uploads
│   └── requirements.txt     # Python project dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── gate/        # Gate Inward, Gate Outward, Gate Pass Registers
│   │   │   └── jobwork/     # Dyed & Finished Fabric Receipts
│   │   └── services/        # Frontend API call endpoints
│   └── package.json         # npm scripts and packages
```

---

## 🧪 Production Build & Deployments

- **Frontend Build**: To generate production-ready static assets:
  ```bash
  npm run build
  ```
- **Jenkins Integration**: The `uploads/` subdirectory structure is preserved via tracked `.gitkeep` files, preventing build failure due to missing directories when deploying on clean CI/CD nodes.
