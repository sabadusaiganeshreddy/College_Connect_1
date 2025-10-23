# College Connect - Campus Recruitment Platform

A comprehensive platform for students to connect across colleges and track company recruitment visits and placements.

## 🚀 Core Features

### 1. User Registration & Authentication
- **College Email Registration**: Students register using their college email (e.g., student@iitd.ac.in)
- **Automatic College Mapping**: System automatically extracts domain from email to map users to colleges
- **LinkedIn Integration**: Collect and display LinkedIn profile information during registration
- **New College Addition**: If email domain is not in database, users can add their college name
- **Data Storage**: Stores user data including name, email, college domain, and LinkedIn profile

### 2. College Management
- **College Spaces**: Each college has its own dedicated page
- **College Information**:
  - College name
  - Email domain (unique identifier)
  - List of registered students with LinkedIn profiles
  - List of companies that visited for recruitment
  - Selection data (which students got selected by which companies)

### 3. Company Visit Tracking
- **Add Companies**: Students can add companies that visited their college
- **Detailed Tracking**:
  - Company name
  - Students who got selected (with toggle functionality)
  - Date of visit (optional)
  - Job roles offered (optional, comma-separated)
- **Selection Management**: Mark yourself or other students as selected

### 4. Search Functionality
- **Search by College**: Enter college name → see all companies that visited that college
- **Search by Company**: Enter company name → see all colleges where that company recruited
- **Statistics Display**: Number of students selected, visit dates, job roles

### 5. Student Profiles
Each student profile displays:
- Name and email
- College affiliation
- LinkedIn profile link (clickable)
- Companies they got selected in
- Selection dates and job roles

## 🛠️ Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool
- **LocalStorage** - Data persistence

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage

### Getting Started

1. **Register**: Enter your name, college email, and LinkedIn profile
2. **Auto-Detection**: System automatically detects your college from email domain
3. **New College**: If your college isn't registered, you'll be prompted to add it

### Adding Company Visits

1. Click "Add Company Visit" button
2. Enter company name
3. Optionally add visit date and job roles (comma-separated)
4. Check "I got selected" if applicable
5. Click "Add Company"

### Managing Selections

- Toggle your selection status for any company
- View all students and their selections
- Track selection dates automatically

### Searching

1. Choose search type (College or Company)
2. Enter search query
3. View detailed results with statistics

### Student Profiles

- Click "Profile" button next to any student
- View their complete information
- See all their company selections
- Access their LinkedIn profile

## 📊 Data Structure

### Student
```typescript
interface Student {
  id: number;
  name: string;
  email: string;
  linkedin: string;
  collegeDomain: string;
  selections: CompanySelection[];
  registeredAt: string;
}
```

### College
```typescript
interface College {
  name: string;
  domain: string;
  students: Student[];
  companies: CompanyVisit[];
  createdAt: string;
}
```

### Company Visit
```typescript
interface CompanyVisit {
  id: number;
  name: string;
  visitDate?: string;
  jobRoles?: string[];
  addedBy: number;
  selectedStudents: number[];
  addedAt: string;
}
```

## 🔒 Data Persistence

All data is stored in browser's `localStorage`:
- **collegeConnectData**: All colleges and their data
- **collegeConnectUser**: Current logged-in user

Data persists across browser sessions and page refreshes.

## 🎨 Features Highlights

- ✅ **Email Validation**: Ensures proper email format
- ✅ **LinkedIn Validation**: Validates LinkedIn profile URLs
- ✅ **Duplicate Prevention**: Prevents duplicate college and user entries
- ✅ **Real-time Updates**: Instant UI updates on data changes
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Demo Data**: Pre-loaded with sample data (IIT Delhi & BITS Pilani)
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **User-Friendly**: Intuitive interface with clear actions
- ✅ **Logout Functionality**: Secure logout with data preservation

## 🎮 Demo Accounts

The app comes with pre-loaded demo data:

**IIT Delhi**
- Student: Rahul Sharma (rahul@iitd.ac.in)
- Companies: Google, Microsoft

**BITS Pilani**
- Student: Priya Verma (priya@bits-pilani.ac.in)
- Companies: Google, Amazon

## 📝 How It Works

1. **Registration Flow**:
   - User enters name, college email, and LinkedIn
   - System extracts domain (e.g., @iitd.ac.in)
   - Checks if college exists in database
   - If yes: Adds student to existing college
   - If no: Prompts user to create new college

2. **Company Tracking**:
   - Students add companies that visited their college
   - Can mark themselves as selected
   - Other students can also mark selections later
   - All changes sync to student profiles

3. **Search System**:
   - College search: Returns matching colleges with all their companies
   - Company search: Returns all colleges visited by that company
   - Shows detailed statistics for each result

## 🚀 Getting Started (Quick Guide)

1. Clone or download the repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Open http://localhost:5173 in your browser
5. Register with a college email (e.g., yourname@yourcollege.edu)
6. Start adding companies and tracking placements!

## 💡 Tips & Best Practices

- Use your real college email for automatic college detection
- Add complete company information (dates, roles) for better tracking
- Keep LinkedIn URLs in format: `linkedin.com/in/yourprofile`
- Search functionality is case-insensitive
- Job roles should be comma-separated (e.g., "SDE-1, SDE-2, Analyst")

## 🔧 Development

### Project Structure
```
college-connect-app/
├── src/
│   ├── CollegeConnect.tsx    # Main component with all features
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind config
└── vite.config.ts             # Vite config
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📈 Future Enhancements

Potential features for future versions:
- Backend integration with database (MongoDB/PostgreSQL)
- User authentication and authorization (JWT)
- Email verification system
- Advanced analytics and charts (placement statistics)
- Export data functionality (CSV/PDF)
- Company profiles and reviews
- Salary information tracking
- Notification system for new company visits
- Social features (comments, likes, shares)
- Mobile app version (React Native)
- Admin panel for college administrators
- Batch-wise filtering and analytics
- Interview preparation resources

## 🐛 Known Limitations

- Data is stored locally in browser (no cloud backup)
- No user authentication (session-based only)
- No email verification
- Limited to one browser (data doesn't sync across devices)
- No company information validation

## 🤝 Contributing

Contributions are welcome! To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your needs.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Tailwind CSS
- Icons by Lucide React
- Inspired by the need to connect students across colleges

---

**Built with ❤️ for connecting students and tracking campus placements**

For questions or support, please open an issue on GitHub.
