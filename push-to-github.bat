@echo off
echo Initializing Git repository...

REM Initialize git repository
git init

REM Configure git (replace with your details)
git config user.name "malikmahmad"
git config user.email "your-email@example.com"

REM Add all files
echo Adding files...
git add .

REM Create first commit
echo Creating commit...
git commit -m "Initial commit: DocuForge with template-based documentation generator (no API keys required)"

REM Add remote repository
echo Adding remote repository...
git remote add origin https://github.com/malikmahmad/docuforge-project.git

REM Push to GitHub
echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo Successfully pushed to GitHub!
pause
