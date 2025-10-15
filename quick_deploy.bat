@echo off
echo 🚀 Everbright Optical System - Quick Deployment Setup
echo ==================================================

echo.
echo 📋 Step 1: Preparing your code for deployment...
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
)

echo Adding all files to Git...
git add .

echo Committing changes...
git commit -m "Prepare for deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

echo.
echo ✅ Code preparation complete!
echo.
echo 📝 Next Steps:
echo 1. Create a GitHub repository at https://github.com/new
echo 2. Push your code: git remote add origin YOUR_REPO_URL
echo 3. Push: git push -u origin main
echo 4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions
echo.
echo 🎯 Quick Links:
echo - Railway (Backend): https://railway.app
echo - Vercel (Frontend): https://vercel.com
echo.
pause
