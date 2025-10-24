import { useState, useEffect } from 'react';
import { Search, Building2, GraduationCap, Users, Plus, CheckCircle, ExternalLink, Calendar, Briefcase, LogOut, User, Award, ArrowLeft, Loader2 } from 'lucide-react';
import { database } from './firebase';
import { ref, set, onValue } from 'firebase/database';

// Type definitions
interface Student {
  id: number;
  name: string;
  email: string;
  linkedin: string;
  collegeDomain: string;
  selections: CompanySelection[];
  registeredAt: string;
}

interface CompanySelection {
  companyName: string;
  selectedAt: string;
}

interface CompanyVisit {
  id: number;
  name: string;
  visitDate?: string;
  jobRoles?: string[];
  addedBy: number;
  selectedStudents: number[];
  addedAt: string;
}

interface College {
  name: string;
  domain: string;
  students: Student[];
  companies: CompanyVisit[];
  createdAt: string;
}

interface CollegesData {
  [domain: string]: College;
}

interface CompanySearchResult {
  college: College;
  companies: CompanyVisit[];
}

export default function CollegeConnect() {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [colleges, setColleges] = useState<CollegesData>({});
  const [view, setView] = useState<'login' | 'dashboard' | 'addCollege' | 'profile' | 'studentProfile'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'college' | 'company'>('college');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // Registration form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  
  // Add company form
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [jobRoles, setJobRoles] = useState('');
  const [selectedForCompany, setSelectedForCompany] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Load data from Firebase on mount
  useEffect(() => {
    let mounted = true;
    const collegesRef = ref(database, 'colleges');
    
    // Set a timeout to prevent infinite loading (reduced to 3 seconds)
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Firebase connection timeout - loading demo data');
        setFirebaseError('Could not connect to Firebase. Using local data.');
        // Initialize with demo data
        const demoData: CollegesData = {
          'iitd_ac_in': {
            name: 'IIT Delhi',
            domain: 'iitd.ac.in',
            createdAt: new Date().toISOString(),
            students: [
              { 
                id: 1, 
                name: 'Rahul Sharma', 
                email: 'rahul@iitd.ac.in', 
                linkedin: 'linkedin.com/in/rahul-sharma', 
                collegeDomain: 'iitd.ac.in',
                selections: [{ companyName: 'Google', selectedAt: new Date().toISOString() }],
                registeredAt: new Date().toISOString()
              }
            ],
            companies: [
              { 
                id: 1,
                name: 'Google', 
                addedBy: 1, 
                selectedStudents: [1],
                visitDate: '2025-01-15',
                jobRoles: ['Software Engineer', 'Product Manager'],
                addedAt: new Date().toISOString()
              },
              { 
                id: 2,
                name: 'Microsoft', 
                addedBy: 1, 
                selectedStudents: [],
                visitDate: '2025-02-20',
                jobRoles: ['Software Development Engineer'],
                addedAt: new Date().toISOString()
              }
            ]
          },
          'bits-pilani.ac.in': {
            name: 'BITS Pilani',
            domain: 'bits-pilani.ac.in',
            createdAt: new Date().toISOString(),
            students: [
              { 
                id: 2, 
                name: 'Priya Verma', 
                email: 'priya@bits-pilani.ac.in', 
                linkedin: 'linkedin.com/in/priya-verma',
                collegeDomain: 'bits-pilani.ac.in',
                selections: [{ companyName: 'Amazon', selectedAt: new Date().toISOString() }],
                registeredAt: new Date().toISOString()
              }
            ],
            companies: [
              { 
                id: 3,
                name: 'Google', 
                addedBy: 2, 
                selectedStudents: [],
                visitDate: '2025-01-10',
                jobRoles: ['Software Engineer'],
                addedAt: new Date().toISOString()
              },
              { 
                id: 4,
                name: 'Amazon', 
                addedBy: 2, 
                selectedStudents: [2],
                visitDate: '2025-03-05',
                jobRoles: ['SDE-1', 'SDE-2'],
                addedAt: new Date().toISOString()
              }
            ]
          }
        };
        setColleges(demoData);
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout
    
    // Listen for changes in colleges data
    const unsubscribe = onValue(
      collegesRef, 
      (snapshot) => {
        clearTimeout(timeout);
        const data = snapshot.val();
        if (data) {
          // Migrate old data with dots in keys to new format with underscores
          const migratedData: CollegesData = {};
          let needsMigration = false;
          
          Object.keys(data).forEach(key => {
            if (key.includes('.')) {
              // Old format detected - needs migration
              needsMigration = true;
              const newKey = domainToKey(key);
              migratedData[newKey] = data[key];
            } else {
              // Already in new format
              migratedData[key] = data[key];
            }
          });
          
          if (needsMigration) {
            // Write migrated data back to Firebase
            console.log('🔄 Migrating old data format to Firebase-safe keys...');
            set(collegesRef, migratedData).then(() => {
              console.log('✅ Data migration complete!');
              setColleges(migratedData);
              setFirebaseError(null);
            }).catch(err => {
              console.error('Migration error:', err);
              setColleges(migratedData);
              setFirebaseError('Data migrated locally, but Firebase write failed.');
            });
          } else {
            setColleges(migratedData);
            setFirebaseError(null);
          }
        } else {
          // Initialize with demo data if no data exists
          const demoData: CollegesData = {
            'iitd_ac_in': {
              name: 'IIT Delhi',
              domain: 'iitd.ac.in',
              createdAt: new Date().toISOString(),
              students: [
                { 
                  id: 1, 
                  name: 'Rahul Sharma', 
                  email: 'rahul@iitd.ac.in', 
                  linkedin: 'linkedin.com/in/rahul-sharma', 
                  collegeDomain: 'iitd.ac.in',
                  selections: [{ companyName: 'Google', selectedAt: new Date().toISOString() }],
                  registeredAt: new Date().toISOString()
                }
              ],
              companies: [
                { 
                  id: 1,
                  name: 'Google', 
                  addedBy: 1, 
                  selectedStudents: [1],
                  visitDate: '2025-01-15',
                  jobRoles: ['Software Engineer', 'Product Manager'],
                  addedAt: new Date().toISOString()
                },
                { 
                  id: 2,
                  name: 'Microsoft', 
                  addedBy: 1, 
                  selectedStudents: [],
                  visitDate: '2025-02-20',
                  jobRoles: ['Software Development Engineer'],
                  addedAt: new Date().toISOString()
                }
              ]
            },
            'bits-pilani_ac_in': {
              name: 'BITS Pilani',
              domain: 'bits-pilani.ac.in',
              createdAt: new Date().toISOString(),
              students: [
                { 
                  id: 2, 
                  name: 'Priya Verma', 
                  email: 'priya@bits-pilani.ac.in', 
                  linkedin: 'linkedin.com/in/priya-verma',
                  collegeDomain: 'bits-pilani.ac.in',
                  selections: [{ companyName: 'Amazon', selectedAt: new Date().toISOString() }],
                  registeredAt: new Date().toISOString()
                }
              ],
              companies: [
                { 
                  id: 3,
                  name: 'Google', 
                  addedBy: 2, 
                  selectedStudents: [],
                  visitDate: '2025-01-10',
                  jobRoles: ['Software Engineer'],
                  addedAt: new Date().toISOString()
                },
                { 
                  id: 4,
                  name: 'Amazon', 
                  addedBy: 2, 
                  selectedStudents: [2],
                  visitDate: '2025-03-05',
                  jobRoles: ['SDE-1', 'SDE-2'],
                  addedAt: new Date().toISOString()
                }
              ]
            }
          };
          set(collegesRef, demoData).catch(err => {
            console.error('Firebase write error:', err);
            setFirebaseError('Firebase write permission denied. Using local data only.');
          });
        }
        setIsLoading(false);
      },
      (error) => {
        clearTimeout(timeout);
        console.error('Firebase error:', error);
        setFirebaseError(`Firebase error: ${error.message}`);
        // Load demo data on error
        const demoData: CollegesData = {
          'iitd_ac_in': {
            name: 'IIT Delhi',
            domain: 'iitd.ac.in',
            createdAt: new Date().toISOString(),
            students: [
              { 
                id: 1, 
                name: 'Rahul Sharma', 
                email: 'rahul@iitd.ac.in', 
                linkedin: 'linkedin.com/in/rahul-sharma', 
                collegeDomain: 'iitd.ac.in',
                selections: [{ companyName: 'Google', selectedAt: new Date().toISOString() }],
                registeredAt: new Date().toISOString()
              }
            ],
            companies: [
              { 
                id: 1,
                name: 'Google', 
                addedBy: 1, 
                selectedStudents: [1],
                visitDate: '2025-01-15',
                jobRoles: ['Software Engineer', 'Product Manager'],
                addedAt: new Date().toISOString()
              },
              { 
                id: 2,
                name: 'Microsoft', 
                addedBy: 1, 
                selectedStudents: [],
                visitDate: '2025-02-20',
                jobRoles: ['Software Development Engineer'],
                addedAt: new Date().toISOString()
              }
            ]
          }
        };
        setColleges(demoData);
        setIsLoading(false);
      }
    );
    
    // Check for saved user session
    const savedUser = localStorage.getItem('collegeConnectUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setView('dashboard');
    }

    // Cleanup listener on unmount
    return () => {
      mounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // Save colleges to Firebase whenever data changes
  useEffect(() => {
    if (Object.keys(colleges).length > 0 && !isLoading && !firebaseError) {
      const collegesRef = ref(database, 'colleges');
      set(collegesRef, colleges).catch(err => {
        console.error('Firebase save error:', err);
      });
    }
  }, [colleges, isLoading, firebaseError]);

  // Save current user to localStorage for session management
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('collegeConnectUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const extractDomain = (email: string): string | null => {
    const match = email.match(/@(.+)$/);
    return match ? match[1] : null;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateLinkedIn = (url: string): boolean => {
    return url.includes('linkedin.com/in/') || url.startsWith('linkedin.com/in/');
  };

  // Convert domain to Firebase-safe key (dots not allowed in Firebase keys)
  const domainToKey = (domain: string): string => {
    return domain.replace(/\./g, '_');
  };

  const handleRegister = () => {
    if (!email || !name || !linkedin) {
      alert('Please fill all fields');
      return;
    }

    if (!validateEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!validateLinkedIn(linkedin)) {
      alert('Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/yourprofile)');
      return;
    }

    const domain = extractDomain(email);
    if (!domain) {
      alert('Invalid email');
      return;
    }

    const domainKey = domainToKey(domain); // Convert to Firebase-safe key

    // Check if college exists
    const existingCollege = colleges[domainKey];
    
    if (!existingCollege) {
      setView('addCollege');
      return;
    }

    // Check if user already registered
    const existingStudent = existingCollege.students.find(s => s.email === email);
    if (existingStudent) {
      alert('This email is already registered!');
      setCurrentUser(existingStudent);
      setView('dashboard');
      return;
    }

    // Add student to college
    const newStudent: Student = {
      id: Date.now(),
      name,
      email,
      linkedin,
      collegeDomain: domain,
      selections: [],
      registeredAt: new Date().toISOString()
    };

    setColleges({
      ...colleges,
      [domainKey]: {
        ...existingCollege,
        students: [...existingCollege.students, newStudent]
      }
    });

    setCurrentUser(newStudent);
    setView('dashboard');
    setEmail('');
    setName('');
    setLinkedin('');
  };

  const handleAddCollege = () => {
    if (!newCollegeName) {
      alert('Please enter college name');
      return;
    }

    const domain = extractDomain(email);
    if (!domain) {
      alert('Invalid email domain');
      return;
    }

    const domainKey = domainToKey(domain); // Convert to Firebase-safe key

    const newStudent: Student = {
      id: Date.now(),
      name,
      email,
      linkedin,
      collegeDomain: domain,
      selections: [],
      registeredAt: new Date().toISOString()
    };

    setColleges({
      ...colleges,
      [domainKey]: {
        name: newCollegeName,
        domain,
        students: [newStudent],
        companies: [],
        createdAt: new Date().toISOString()
      }
    });

    setCurrentUser(newStudent);
    setView('dashboard');
    setNewCollegeName('');
    setEmail('');
    setName('');
    setLinkedin('');
  };

  const handleAddCompany = () => {
    if (!companyName || !currentUser) return;

    const domainKey = domainToKey(currentUser.collegeDomain); // Convert to Firebase-safe key
    const collegeData = colleges[domainKey];
    const existingCompany = collegeData.companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());

    if (existingCompany) {
      alert('Company already added to this college');
      return;
    }

    const newCompany: CompanyVisit = {
      id: Date.now(),
      name: companyName,
      addedBy: currentUser.id,
      selectedStudents: selectedForCompany ? [currentUser.id] : [],
      visitDate: visitDate || undefined,
      jobRoles: jobRoles ? jobRoles.split(',').map(r => r.trim()).filter(r => r) : undefined,
      addedAt: new Date().toISOString()
    };

    const updatedColleges = {
      ...colleges,
      [domainKey]: {
        ...collegeData,
        companies: [...collegeData.companies, newCompany]
      }
    };

    // Update student selections if they marked themselves as selected
    if (selectedForCompany) {
      const studentIndex = collegeData.students.findIndex(s => s.id === currentUser.id);
      if (studentIndex !== -1) {
        const updatedStudents = [...collegeData.students];
        updatedStudents[studentIndex] = {
          ...updatedStudents[studentIndex],
          selections: [...updatedStudents[studentIndex].selections, {
            companyName,
            selectedAt: new Date().toISOString()
          }]
        };
        updatedColleges[domainKey].students = updatedStudents;
        
        // Update current user
        setCurrentUser(updatedStudents[studentIndex]);
      }
    }

    setColleges(updatedColleges);
    setCompanyName('');
    setVisitDate('');
    setJobRoles('');
    setSelectedForCompany(false);
    setShowAddCompany(false);
  };

  const toggleSelection = (companyName: string) => {
    if (!currentUser) return;

    const domainKey = domainToKey(currentUser.collegeDomain); // Convert to Firebase-safe key
    const collegeData = colleges[domainKey];
    const companyIndex = collegeData.companies.findIndex(c => c.name === companyName);
    
    if (companyIndex === -1) return;

    const company = collegeData.companies[companyIndex];
    const isSelected = company.selectedStudents.includes(currentUser.id);
    
    const updatedCompanies = [...collegeData.companies];
    updatedCompanies[companyIndex] = {
      ...company,
      selectedStudents: isSelected 
        ? company.selectedStudents.filter(id => id !== currentUser.id)
        : [...company.selectedStudents, currentUser.id]
    };

    // Update student selections
    const studentIndex = collegeData.students.findIndex(s => s.id === currentUser.id);
    const updatedStudents = [...collegeData.students];
    
    if (isSelected) {
      // Remove selection
      updatedStudents[studentIndex] = {
        ...updatedStudents[studentIndex],
        selections: updatedStudents[studentIndex].selections.filter(s => s.companyName !== companyName)
      };
    } else {
      // Add selection
      updatedStudents[studentIndex] = {
        ...updatedStudents[studentIndex],
        selections: [...updatedStudents[studentIndex].selections, {
          companyName,
          selectedAt: new Date().toISOString()
        }]
      };
    }

    setColleges({
      ...colleges,
      [domainKey]: {
        ...collegeData,
        companies: updatedCompanies,
        students: updatedStudents
      }
    });

    // Update current user
    setCurrentUser(updatedStudents[studentIndex]);
  };

  const getSearchResults = () => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();

    if (searchType === 'college') {
      return Object.values(colleges).filter(college =>
        college.name.toLowerCase().includes(query)
      );
    } else {
      const results: CompanySearchResult[] = [];
      Object.values(colleges).forEach(college => {
        const matchingCompanies = college.companies.filter(company =>
          company.name.toLowerCase().includes(query)
        );
        if (matchingCompanies.length > 0) {
          results.push({ college, companies: matchingCompanies });
        }
      });
      return results;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('collegeConnectUser');
    setView('login');
  };

  const viewStudentProfile = (studentId: number) => {
    setSelectedStudentId(studentId);
    setView('studentProfile');
  };

  const getStudentById = (studentId: number): Student | null => {
    for (const college of Object.values(colleges)) {
      const student = college.students.find(s => s.id === studentId);
      if (student) return student;
    }
    return null;
  };

  const myCollege = currentUser ? colleges[domainToKey(currentUser.collegeDomain)] : null;
  const searchResults = getSearchResults();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }

  // Login view
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <GraduationCap className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">College Connect</h1>
            <p className="text-gray-600 mt-2">Connect with students across colleges</p>
            {!firebaseError ? (
              <p className="text-xs text-green-600 mt-1">🔥 Real-time sync enabled</p>
            ) : (
              <p className="text-xs text-yellow-600 mt-1">⚠️ Using local data (Firebase not connected)</p>
            )}
          </div>

          {firebaseError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">{firebaseError}</p>
              <p className="text-xs text-yellow-600 mt-1">
                Check Firebase Console: Database must be enabled and rules must allow access.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your.name@college.edu"
              />
              <p className="text-xs text-gray-500 mt-1">Use your college email (e.g., student@iitd.ac.in)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="linkedin.com/in/yourprofile"
              />
              <p className="text-xs text-gray-500 mt-1">Enter your LinkedIn profile URL</p>
            </div>

            <button
              onClick={handleRegister}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add college view
  if (view === 'addCollege') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Building2 className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">New College Detected!</h2>
            <p className="text-gray-600 mt-2">We haven't seen <span className="font-semibold">{extractDomain(email)}</span> before</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College Name</label>
              <input
                type="text"
                value={newCollegeName}
                onChange={(e) => setNewCollegeName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your college name"
              />
            </div>

            <button
              onClick={handleAddCollege}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Add College & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Student Profile view
  if (view === 'studentProfile' && selectedStudentId) {
    const student = getStudentById(selectedStudentId);
    const studentCollege = student ? colleges[student.collegeDomain] : null;

    if (!student || !studentCollege) {
      setView('dashboard');
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button 
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
                <p className="text-gray-600 mb-2">{student.email}</p>
                <p className="text-indigo-600 font-medium mb-3">{studentCollege.name}</p>
                <a
                  href={`https://${student.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  View LinkedIn Profile
                </a>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                Company Selections
              </h2>
              {student.selections.length > 0 ? (
                <div className="space-y-3">
                  {student.selections.map((selection, idx) => {
                    const company = studentCollege.companies.find(c => c.name === selection.companyName);
                    return (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{selection.companyName}</h3>
                            <p className="text-sm text-gray-600">
                              Selected on {new Date(selection.selectedAt).toLocaleDateString()}
                            </p>
                            {company?.visitDate && (
                              <p className="text-sm text-gray-600">
                                Visit Date: {new Date(company.visitDate).toLocaleDateString()}
                              </p>
                            )}
                            {company?.jobRoles && company.jobRoles.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {company.jobRoles.map((role, i) => (
                                  <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">No company selections yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">College Connect</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('profile')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <User className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">{currentUser?.name}</p>
                  <p className="text-xs text-gray-600">{myCollege?.name}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Search Platform</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setSearchType('college')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                searchType === 'college' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Search Colleges
            </button>
            <button
              onClick={() => setSearchType('company')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                searchType === 'company' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Briefcase className="w-4 h-4 inline mr-2" />
              Search Companies
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={`Search for ${searchType === 'college' ? 'colleges' : 'companies'}...`}
            />
          </div>

          {searchQuery && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Search Results ({searchResults.length} found)
              </h3>
              {searchType === 'college' ? (
                <div className="space-y-3">
                  {(searchResults as College[]).map((college) => (
                    <div key={college.domain} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{college.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{college.domain}</p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Companies Visited:</p>
                            <div className="flex flex-wrap gap-2">
                              {college.companies.map((company) => (
                                <span key={company.id} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                                  {company.name} ({company.selectedStudents.length} selected)
                                </span>
                              ))}
                              {college.companies.length === 0 && (
                                <span className="text-sm text-gray-500">No companies added yet</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {college.students.length} students
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {college.companies.length} companies
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <p className="text-gray-600 text-center py-8">No colleges found matching "{searchQuery}"</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {(searchResults as CompanySearchResult[]).map((result, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                      <h4 className="font-semibold text-gray-900 text-lg mb-3">{result.college.name}</h4>
                      <div className="space-y-2">
                        {result.companies.map((company) => (
                          <div key={company.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-green-900">{company.name}</h5>
                                {company.visitDate && (
                                  <p className="text-sm text-green-700 flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    Visit: {new Date(company.visitDate).toLocaleDateString()}
                                  </p>
                                )}
                                {company.jobRoles && company.jobRoles.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {company.jobRoles.map((role, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm text-green-700 mt-2 font-medium">
                                  {company.selectedStudents.length} students selected
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <p className="text-gray-600 text-center py-8">No companies found matching "{searchQuery}"</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* My College Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-600" />
              My College - {myCollege?.name}
            </h2>
            <button
              onClick={() => setShowAddCompany(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Company Visit
            </button>
          </div>

          {showAddCompany && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Add Company Visit</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Company name (e.g., Google, Microsoft)"
                />
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Visit date (optional)"
                />
                <input
                  type="text"
                  value={jobRoles}
                  onChange={(e) => setJobRoles(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Job roles (comma-separated, e.g., SDE-1, SDE-2)"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedForCompany}
                    onChange={(e) => setSelectedForCompany(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">I got selected by this company</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCompany}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Company
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCompany(false);
                      setCompanyName('');
                      setVisitDate('');
                      setJobRoles('');
                      setSelectedForCompany(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Companies Visited ({myCollege?.companies?.length || 0})
            </h3>
            <div className="grid gap-3">
              {myCollege?.companies?.map((company) => (
                <div key={company.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{company.name}</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-1">
                        <span>{company.selectedStudents.length} students selected</span>
                        {company.visitDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(company.visitDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {company.jobRoles && company.jobRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {company.jobRoles.map((role, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {currentUser && (
                      <button
                        onClick={() => toggleSelection(company.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                          company.selectedStudents.includes(currentUser.id)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {company.selectedStudents.includes(currentUser.id) ? 'Selected' : 'Mark as Selected'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!myCollege?.companies || myCollege.companies.length === 0) && (
                <p className="text-gray-600 text-center py-8">No companies added yet. Be the first to add one!</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students ({myCollege?.students?.length || 0})
            </h3>
            <div className="grid gap-3">
              {myCollege?.students?.map((student) => (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      {student.selections.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Selected by:</p>
                          <div className="flex flex-wrap gap-1">
                            {student.selections.map((sel, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                {sel.companyName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://${student.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        LinkedIn
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => viewStudentProfile(student.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
