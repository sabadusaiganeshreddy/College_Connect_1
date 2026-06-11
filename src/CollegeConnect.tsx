import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Loader2,
  LogOut,
  Plus,
  Search,
  User,
  Users,
} from 'lucide-react';
import {
  addCompanyVisit,
  ApiError,
  College,
  CollegesData,
  CompanyVisit,
  fetchPlacementSnapshot,
  registerStudent,
  SimilarCollege,
  Student,
  subscribeToPlacementEvents,
  toggleCompanySelection,
} from './services/api';

interface CompanySearchResult {
  college: College;
  companies: CompanyVisit[];
}

type View = 'login' | 'dashboard' | 'addCollege' | 'profile' | 'studentProfile';

const emptyColleges: CollegesData = {};

function domainToKey(domain: string): string {
  return domain.replace(/\./g, '_').toLowerCase();
}

function extractDomain(email: string): string | null {
  const match = email.trim().toLowerCase().match(/@(.+)$/);
  return match ? match[1] : null;
}

function validateLinkedIn(url: string): boolean {
  return url.includes('linkedin.com/in/');
}

function getStoredUser(): Student | null {
  try {
    const raw = localStorage.getItem('collegeConnectUser');
    return raw ? JSON.parse(raw) as Student : null;
  } catch {
    return null;
  }
}

function findStudentInSnapshot(colleges: CollegesData, studentId: string): Student | null {
  for (const college of Object.values(colleges)) {
    const student = college.students.find((candidate) => candidate.id === studentId);
    if (student) {
      return student;
    }
  }
  return null;
}

function getApiDetails(error: unknown): Record<string, unknown> {
  if (error instanceof ApiError && error.details && typeof error.details === 'object') {
    return error.details as Record<string, unknown>;
  }
  return {};
}

function toDisplayDate(value?: string): string {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleDateString();
}

export default function CollegeConnect() {
  const [currentUser, setCurrentUser] = useState<Student | null>(() => getStoredUser());
  const [colleges, setColleges] = useState<CollegesData>(emptyColleges);
  const [view, setView] = useState<View>(() => (getStoredUser() ? 'dashboard' : 'login'));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'college' | 'company'>('college');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [similarColleges, setSimilarColleges] = useState<SimilarCollege[]>([]);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [jobRoles, setJobRoles] = useState('');
  const [selectedForCompany, setSelectedForCompany] = useState(false);
  const [numberOfSelections, setNumberOfSelections] = useState('');

  const refreshSnapshot = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const snapshot = await fetchPlacementSnapshot();
      setColleges(snapshot);
      setApiError(null);
      localStorage.setItem('lastKnownGoodData', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: snapshot,
      }));

      setCurrentUser((previous) => {
        if (!previous) {
          return previous;
        }
        return findStudentInSnapshot(snapshot, previous.id) || previous;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not connect to backend API';
      setApiError(message);

      try {
        const backup = localStorage.getItem('lastKnownGoodData');
        if (backup) {
          const parsed = JSON.parse(backup) as { data: CollegesData };
          setColleges(parsed.data);
        }
      } catch {
        setColleges(emptyColleges);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void refreshSnapshot();
    const unsubscribe = subscribeToPlacementEvents(() => {
      void refreshSnapshot(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('collegeConnectUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const myCollege = currentUser ? colleges[domainToKey(currentUser.collegeDomain)] : null;

  const stats = useMemo(() => {
    const collegeList = Object.values(colleges);
    return {
      users: collegeList.reduce((sum, college) => sum + college.students.length, 0),
      colleges: collegeList.length,
      companies: collegeList.reduce((sum, college) => sum + college.companies.length, 0),
    };
  }, [colleges]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    if (searchType === 'college') {
      return Object.values(colleges).filter((college) =>
        college.name.toLowerCase().includes(query) || college.domain.toLowerCase().includes(query),
      );
    }

    const results: CompanySearchResult[] = [];
    for (const college of Object.values(colleges)) {
      const companies = college.companies.filter((company) => company.name.toLowerCase().includes(query));
      if (companies.length > 0) {
        results.push({ college, companies });
      }
    }
    return results;
  }, [colleges, searchQuery, searchType]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !linkedin.trim()) {
      alert('Please fill all fields');
      return;
    }

    if (!extractDomain(email)) {
      alert('Please enter a valid college email address');
      return;
    }

    if (!validateLinkedIn(linkedin)) {
      alert('Please enter a valid LinkedIn profile URL containing linkedin.com/in/');
      return;
    }

    setIsSaving(true);
    setSimilarColleges([]);

    try {
      const response = await registerStudent({ name, email, linkedin });
      localStorage.setItem('collegeConnectToken', response.token);
      setCurrentUser(response.student);
      setView('dashboard');
      setEmail('');
      setName('');
      setLinkedin('');
      await refreshSnapshot(true);
    } catch (error) {
      const details = getApiDetails(error);
      if (error instanceof ApiError && error.code === 'COLLEGE_REQUIRED') {
        setSimilarColleges((details.similarColleges as SimilarCollege[]) || []);
        setView('addCollege');
      } else {
        alert(error instanceof Error ? error.message : 'Registration failed');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCollege = async () => {
    if (!newCollegeName.trim()) {
      alert('Please enter college name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await registerStudent({
        name,
        email,
        linkedin,
        collegeName: newCollegeName,
      });
      localStorage.setItem('collegeConnectToken', response.token);
      setCurrentUser(response.student);
      setView('dashboard');
      setNewCollegeName('');
      setEmail('');
      setName('');
      setLinkedin('');
      await refreshSnapshot(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'College creation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCompany = async () => {
    if (!companyName.trim()) {
      alert('Please enter company name');
      return;
    }

    const totalSelections = numberOfSelections.trim()
      ? Number.parseInt(numberOfSelections, 10)
      : undefined;

    if (totalSelections !== undefined && Number.isNaN(totalSelections)) {
      alert('Number of selections must be a valid number');
      return;
    }

    setIsSaving(true);
    try {
      await addCompanyVisit({
        name: companyName,
        visitDate: visitDate || undefined,
        jobRoles: jobRoles.split(',').map((role) => role.trim()).filter(Boolean),
        selectedForCurrentUser: selectedForCompany,
        totalSelections,
      });

      setCompanyName('');
      setVisitDate('');
      setJobRoles('');
      setSelectedForCompany(false);
      setNumberOfSelections('');
      setShowAddCompany(false);
      await refreshSnapshot(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not add company visit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSelection = async (companyId: string) => {
    setIsSaving(true);
    try {
      await toggleCompanySelection(companyId);
      await refreshSnapshot(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not update selection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('collegeConnectToken');
    localStorage.removeItem('collegeConnectUser');
    setView('login');
  };

  const selectedStudent = selectedStudentId ? findStudentInSnapshot(colleges, selectedStudentId) : null;
  const selectedStudentCollege = selectedStudent
    ? colleges[domainToKey(selectedStudent.collegeDomain)]
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-14 h-14 mx-auto text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-600 text-lg">Connecting to placement network...</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <GraduationCap className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-3xl font-bold text-slate-950">College Connect</h1>
            <p className="text-slate-600 mt-2">Placement collaboration across colleges</p>
            <p className={`text-xs mt-2 ${apiError ? 'text-amber-600' : 'text-emerald-700'}`}>
              {apiError ? 'Offline snapshot mode' : 'Realtime API online'}
            </p>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">{apiError}</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">Full Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">College Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your.name@college.edu"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">LinkedIn Profile</span>
              <input
                value={linkedin}
                onChange={(event) => setLinkedin(event.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="linkedin.com/in/yourprofile"
              />
            </label>

            <button
              onClick={handleRegister}
              disabled={isSaving}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSaving ? 'Registering...' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'addCollege') {
    const domain = extractDomain(email);

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Building2 className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-950">Add College</h2>
            <p className="text-slate-600 mt-2">{domain} is not registered yet</p>
          </div>

          {similarColleges.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900 mb-2">Similar colleges found</p>
              <div className="space-y-1">
                {similarColleges.map((college) => (
                  <p key={college.domainKey} className="text-sm text-amber-800">
                    {college.name} ({college.domain})
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">College Name</span>
              <input
                value={newCollegeName}
                onChange={(event) => setNewCollegeName(event.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your college name"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setView('login')}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                Back
              </button>
              <button
                onClick={handleAddCollege}
                disabled={isSaving}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'studentProfile') {
    if (!selectedStudent || !selectedStudentCollege) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 mb-4">Student not found</p>
            <button
              onClick={() => setView('dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 text-indigo-700 hover:text-indigo-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-950 mb-2">{selectedStudent.name}</h1>
                <p className="text-slate-600 mb-2">{selectedStudent.email}</p>
                <p className="text-indigo-700 font-medium mb-3">{selectedStudentCollege.name}</p>
                <a
                  href={selectedStudent.linkedin.startsWith('http') ? selectedStudent.linkedin : `https://${selectedStudent.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                >
                  LinkedIn
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-950 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Selections
              </h2>
              {selectedStudent.selections.length > 0 ? (
                <div className="grid gap-3">
                  {selectedStudent.selections.map((selection) => (
                    <div key={`${selection.companyName}-${selection.selectedAt}`} className="border border-emerald-200 bg-emerald-50 rounded-lg p-4">
                      <p className="font-semibold text-emerald-950">{selection.companyName}</p>
                      <p className="text-sm text-emerald-700 mt-1">Selected on {toDisplayDate(selection.selectedAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">No selections added yet.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (view === 'profile' && currentUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 text-indigo-700 hover:text-indigo-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-slate-950 mb-6">My Profile</h1>
            <div className="space-y-4">
              <p><span className="font-medium text-slate-700">Name:</span> {currentUser.name}</p>
              <p><span className="font-medium text-slate-700">Email:</span> {currentUser.email}</p>
              <p><span className="font-medium text-slate-700">College:</span> {myCollege?.name || currentUser.collegeDomain}</p>
              <p><span className="font-medium text-slate-700">Joined:</span> {toDisplayDate(currentUser.registeredAt)}</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-9 h-9 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-950">College Connect</h1>
              <p className="text-sm text-slate-600">{currentUser ? `${currentUser.name} - ${myCollege?.name || currentUser.collegeDomain}` : 'Placement dashboard'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('profile')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {apiError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">{apiError}</p>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Students</p>
                <p className="text-3xl font-bold text-slate-950">{stats.users}</p>
              </div>
              <Users className="w-9 h-9 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Colleges</p>
                <p className="text-3xl font-bold text-slate-950">{stats.colleges}</p>
              </div>
              <Building2 className="w-9 h-9 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Companies</p>
                <p className="text-3xl font-bold text-slate-950">{stats.companies}</p>
              </div>
              <Briefcase className="w-9 h-9 text-violet-600" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-600" />
              Search Network
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType('college')}
                className={`px-4 py-2 rounded-lg font-medium transition ${searchType === 'college' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Colleges
              </button>
              <button
                onClick={() => setSearchType('company')}
                className={`px-4 py-2 rounded-lg font-medium transition ${searchType === 'company' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Companies
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={`Search ${searchType === 'college' ? 'colleges' : 'companies'}...`}
            />
          </div>

          {searchQuery.trim() && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-950 mb-3">
                Results ({searchResults.length})
              </h3>
              {searchType === 'college' ? (
                <div className="grid gap-3">
                  {(searchResults as College[]).map((college) => (
                    <CollegeResult
                      key={college.domain}
                      college={college}
                      onStudentOpen={(studentId) => {
                        setSelectedStudentId(studentId);
                        setView('studentProfile');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {(searchResults as CompanySearchResult[]).map((result) => (
                    <CompanyResult
                      key={`${result.college.domain}-${result.companies.map((company) => company.id).join('-')}`}
                      result={result}
                      onStudentOpen={(studentId) => {
                        setSelectedStudentId(studentId);
                        setView('studentProfile');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-600" />
              {myCollege?.name || 'My College'}
            </h2>
            <button
              onClick={() => setShowAddCompany(true)}
              disabled={!myCollege || isSaving}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Add Company Visit
            </button>
          </div>

          {showAddCompany && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-slate-950 mb-3">Add Company Visit</h3>
              <div className="grid gap-3">
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Company name"
                />
                <input
                  type="date"
                  value={visitDate}
                  onChange={(event) => setVisitDate(event.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  value={jobRoles}
                  onChange={(event) => setJobRoles(event.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Job roles, comma-separated"
                />
                <input
                  type="number"
                  value={numberOfSelections}
                  onChange={(event) => setNumberOfSelections(event.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Number of students selected"
                  min="0"
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedForCompany}
                    onChange={(event) => setSelectedForCompany(event.target.checked)}
                    className="w-4 h-4"
                  />
                  I got selected by this company
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCompany}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Add Company'}
                  </button>
                  <button
                    onClick={() => setShowAddCompany(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="font-semibold text-slate-950 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Companies Visited ({myCollege?.companies.length || 0})
            </h3>
            <div className="grid gap-3">
              {myCollege?.companies.map((company) => {
                const selectedStudents = myCollege.students.filter((student) =>
                  company.selectedStudents.includes(student.id),
                );
                const isSelected = currentUser ? company.selectedStudents.includes(currentUser.id) : false;

                return (
                  <div key={company.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-950">{company.name}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-1">
                          <span className="font-medium text-emerald-700">
                            {company.totalSelections ?? selectedStudents.length} selected
                          </span>
                          {company.visitDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {toDisplayDate(company.visitDate)}
                            </span>
                          )}
                        </div>
                        {company.jobRoles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {company.jobRoles.map((role) => (
                              <span key={role} className="px-2 py-1 bg-violet-50 text-violet-700 rounded text-xs">
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedStudents.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedStudents.map((student) => (
                              <button
                                key={student.id}
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  setView('studentProfile');
                                }}
                                className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition flex items-center gap-1"
                              >
                                <User className="w-3 h-3" />
                                {student.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleSelection(company.id)}
                        disabled={isSaving}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition disabled:opacity-60 ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isSelected ? 'Selected' : 'Mark Selected'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {(!myCollege || myCollege.companies.length === 0) && (
                <p className="text-slate-600 text-center py-8">No companies added yet.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students ({myCollege?.students.length || 0})
            </h3>
            <div className="grid gap-3">
              {myCollege?.students.map((student) => (
                <div key={student.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-950">{student.name}</h4>
                      <p className="text-sm text-slate-600">{student.email}</p>
                      {student.selections.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {student.selections.map((selection) => (
                            <span key={`${student.id}-${selection.companyName}`} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">
                              {selection.companyName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={student.linkedin.startsWith('http') ? student.linkedin : `https://${student.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                      >
                        LinkedIn
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setView('studentProfile');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
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
        </section>
      </main>
    </div>
  );
}

function CollegeResult({
  college,
  onStudentOpen,
}: {
  college: College;
  onStudentOpen: (studentId: string) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition">
      <h4 className="font-semibold text-slate-950 text-lg">{college.name}</h4>
      <p className="text-sm text-slate-600 mb-3">{college.domain}</p>
      <div className="space-y-3 mb-4">
        {college.companies.map((company) => {
          const selectedStudents = college.students.filter((student) =>
            company.selectedStudents.includes(student.id),
          );
          return (
            <div key={company.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-950">{company.name}</span>
                <span className="text-sm text-slate-600">{company.totalSelections ?? selectedStudents.length} selected</span>
              </div>
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => onStudentOpen(student.id)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      {student.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {college.students.length} students
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="w-4 h-4" />
          {college.companies.length} companies
        </span>
      </div>
    </div>
  );
}

function CompanyResult({
  result,
  onStudentOpen,
}: {
  result: CompanySearchResult;
  onStudentOpen: (studentId: string) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition">
      <h4 className="font-semibold text-slate-950 text-lg mb-3">{result.college.name}</h4>
      <div className="space-y-2">
        {result.companies.map((company) => {
          const selectedStudents = result.college.students.filter((student) =>
            company.selectedStudents.includes(student.id),
          );

          return (
            <div key={company.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h5 className="font-medium text-emerald-950">{company.name}</h5>
                  {company.visitDate && (
                    <p className="text-sm text-emerald-700 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Visit: {toDisplayDate(company.visitDate)}
                    </p>
                  )}
                  <p className="text-sm text-emerald-700 mt-2 font-medium">
                    {company.totalSelections ?? selectedStudents.length} students selected
                  </p>
                  {selectedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-200">
                      {selectedStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => onStudentOpen(student.id)}
                          className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs hover:bg-emerald-100 transition flex items-center gap-1.5"
                        >
                          <User className="w-3 h-3" />
                          {student.name}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

