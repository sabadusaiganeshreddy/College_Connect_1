# College Connect - Quick Start Guide

## 🚀 Getting Started

### Installation
```bash
cd college-connect-app
npm install
npm run dev
```

The app will open at **http://localhost:5174/** (or 5173)

## 📖 Step-by-Step Usage Guide

### 1️⃣ User Registration

**First Time Users:**
1. Open the application
2. You'll see the registration form
3. Enter your details:
   - **Full Name**: Your complete name
   - **College Email**: Use format `yourname@college.edu` (e.g., `john@iitd.ac.in`)
   - **LinkedIn Profile**: Enter `linkedin.com/in/yourprofile`
4. Click **Register**

**What Happens:**
- System extracts domain from your email (e.g., `@iitd.ac.in`)
- Checks if college exists
- If **college exists**: You're added to that college
- If **college doesn't exist**: You'll be asked to add college name

### 2️⃣ Adding a New College

If your college isn't registered:
1. You'll see "New College Detected!" screen
2. Enter your college name (e.g., "IIT Delhi")
3. Click **Add College & Continue**
4. You're now registered and logged in!

### 3️⃣ Dashboard Overview

After logging in, you'll see:

**Header:**
- College Connect logo
- Your name and college
- Logout button

**Search Section:**
- Toggle between "Search Colleges" and "Search Companies"
- Search bar with real-time results

**My College Section:**
- "Add Company Visit" button
- List of companies that visited
- List of students in your college

### 4️⃣ Adding Company Visits

1. Click **"Add Company Visit"** button
2. Fill in the form:
   - **Company Name**: Required (e.g., "Google")
   - **Visit Date**: Optional (select from date picker)
   - **Job Roles**: Optional (comma-separated, e.g., "SDE-1, SDE-2")
   - **Checkbox**: Check if you got selected
3. Click **Add Company**

**Result:**
- Company appears in your college's company list
- If you marked selected, you'll see "Selected" badge
- Job roles appear as tags
- Visit date is displayed

### 5️⃣ Managing Selections

**Mark Yourself as Selected:**
1. Find the company in the list
2. Click **"Mark as Selected"** button
3. Button turns green with "Selected" text
4. Your profile is automatically updated

**Remove Selection:**
1. Click the green **"Selected"** button
2. It changes back to "Mark as Selected"
3. Selection removed from your profile

### 6️⃣ Searching

**Search by College:**
1. Click **"Search Colleges"** tab
2. Type college name in search bar
3. See results showing:
   - College name and domain
   - All companies that visited
   - Number of students selected per company
   - Total students count

**Search by Company:**
1. Click **"Search Companies"** tab
2. Type company name in search bar
3. See results showing:
   - College name
   - Company details (visit date, job roles)
   - Number of students selected
   - All colleges where company recruited

### 7️⃣ Viewing Student Profiles

**From Student List:**
1. Scroll to "Students" section
2. Find any student
3. Click **"Profile"** button next to their name

**Profile Page Shows:**
- Student name and photo placeholder
- Email address
- College affiliation
- LinkedIn profile (clickable link)
- All companies they got selected in
- Selection dates
- Job roles for each selection
- Company visit dates

**Navigation:**
- Click **"Back to Dashboard"** to return

### 8️⃣ Using LinkedIn Integration

**View LinkedIn Profiles:**
1. In student list, click **"LinkedIn"** button
2. Opens LinkedIn profile in new tab

**Your LinkedIn:**
- Make sure to enter correct URL during registration
- Format: `linkedin.com/in/yourprofile` or full URL

### 9️⃣ Logout

1. Click **"Logout"** button in header
2. Returns to registration page
3. Your data is saved and will be restored when you login again

## 💡 Pro Tips

### Email Format
✅ **Correct**: `john.doe@iitd.ac.in`
❌ **Wrong**: `john@gmail.com` (use college email)

### LinkedIn URL
✅ **Correct**: 
- `linkedin.com/in/johndoe`
- `https://linkedin.com/in/johndoe`
❌ **Wrong**: 
- `linkedin.com/johndoe`
- `facebook.com/johndoe`

### Job Roles
✅ **Correct**: `SDE-1, SDE-2, Analyst`
❌ **Wrong**: `SDE-1; SDE-2` (use commas)

### Company Names
- Be consistent: "Google" not "google LLC"
- Exact match helps avoid duplicates
- System checks for duplicates (case-insensitive)

## 🎯 Common Tasks

### Task: Check which companies visited a college
1. Click "Search Colleges"
2. Type college name
3. View company list in results

### Task: See where a company recruited
1. Click "Search Companies"
2. Type company name
3. View all colleges in results

### Task: Track your placements
1. Go to your profile (click your name → Profile)
2. View "Company Selections" section
3. See all companies you're selected in

### Task: Add multiple companies
1. Click "Add Company Visit"
2. Fill details, click "Add Company"
3. Form closes
4. Click "Add Company Visit" again
5. Repeat for each company

### Task: Update your selections
1. Find company in "Companies Visited" section
2. Toggle "Mark as Selected" / "Selected" button
3. Changes save automatically

## 🔍 Understanding the Interface

### Color Codes
- **Indigo/Purple**: Primary actions, selection tags
- **Green**: Selected status, success
- **Blue**: LinkedIn links, info
- **Gray**: Secondary info, empty states
- **Red**: Logout, warnings

### Icons Meaning
- 🎓 (GraduationCap): College/Education
- 🏢 (Building2): Companies
- 👥 (Users): Students
- 🔍 (Search): Search function
- ➕ (Plus): Add new
- ✓ (CheckCircle): Selected status
- 🔗 (ExternalLink): External links
- 📅 (Calendar): Dates
- 💼 (Briefcase): Job/Career
- 👤 (User): Profile
- 🏆 (Award): Achievements
- ← (ArrowLeft): Back navigation

## 📊 Sample Data

The app comes with demo data:

**IIT Delhi** (`iitd.ac.in`)
- Student: Rahul Sharma
- Companies: Google, Microsoft

**BITS Pilani** (`bits-pilani.ac.in`)
- Student: Priya Verma
- Companies: Google, Amazon

You can:
- Search for these colleges
- Search for these companies
- See how data is structured
- Test all features

## ❓ Troubleshooting

### Issue: "Please fill all fields"
**Solution**: All three fields (Name, Email, LinkedIn) are required

### Issue: "Please enter a valid email address"
**Solution**: Use proper email format with @ and domain

### Issue: "Please enter a valid LinkedIn profile URL"
**Solution**: Include `linkedin.com/in/` in your URL

### Issue: "This email is already registered"
**Solution**: You're already in the system. You'll be logged in automatically.

### Issue: "Company already added to this college"
**Solution**: Someone already added this company. You can mark yourself as selected.

### Issue: Data disappeared after refresh
**Solution**: Data is saved in localStorage. Don't clear browser data. Use same browser.

### Issue: Can't find search results
**Solution**: 
- Check spelling
- Try partial names (e.g., "IIT" instead of "IIT Delhi")
- Search is case-insensitive

## 🎓 Best Practices

1. **Use Real College Email**: Helps with automatic college detection
2. **Complete LinkedIn Profile**: Better networking
3. **Add Job Roles**: Helps other students know what positions were offered
4. **Add Visit Dates**: Track recruitment timeline
5. **Keep Data Updated**: Mark selections as they happen
6. **Search Before Adding**: Avoid duplicate companies
7. **Explore Profiles**: Learn about other students' placements

## 📱 Keyboard Shortcuts

- **Tab**: Navigate between form fields
- **Enter**: Submit forms
- **Escape**: (Future: Close modals)

## 🔄 Data Sync

- All changes save **automatically**
- No "Save" button needed
- Refresh page to see latest data
- Data persists across browser sessions
- Logout doesn't delete data

## 🎉 Success Checklist

After registration, you should be able to:
- ✅ See your name in header
- ✅ See your college name
- ✅ Add companies
- ✅ Mark selections
- ✅ Search for colleges
- ✅ Search for companies
- ✅ View student profiles
- ✅ Access LinkedIn profiles
- ✅ Logout and login back

---

**Need Help?** Check DOCUMENTATION.md for detailed technical information.

**Ready to start?** Run `npm run dev` and register now! 🚀
