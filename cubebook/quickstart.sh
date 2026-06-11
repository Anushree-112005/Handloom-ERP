#!/bin/bash

# CubeBook Quick Start Script
# Run this to set up and start the complete application

echo "🎯 CubeBook - Quick Start Setup"
echo "================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.10+"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 16+"
    exit 1
fi

# Backend setup
echo "📦 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

echo "   Activating virtual environment..."
source venv/bin/activate

echo "   Installing dependencies..."
pip install -r requirements.txt -q

echo "✅ Backend ready!"
echo ""

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install -q
fi

echo "✅ Frontend ready!"
echo ""

# Instructions
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd cubebook/backend"
echo "  source venv/bin/activate  # or use: . venv/Scripts/activate (Windows)"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd cubebook/frontend"
echo "  npm run dev"
echo ""
echo "Terminal 3 (Seed Data):"
echo "  cd cubebook/backend"
echo "  source venv/bin/activate"
echo "  python -m scripts.seed_data"
echo ""
echo "📍 Access:"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo "  Database: cubebook.db (SQLite)"
echo ""
echo "✨ Happy accounting!"
