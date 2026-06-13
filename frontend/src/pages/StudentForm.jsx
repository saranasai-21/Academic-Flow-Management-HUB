import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, User, BookOpen, Heart, Wallet, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './StudentForm.css';

const StudentForm = () => {
  const { id } = useParams(); // undefined if adding, exists if editing
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    rollNumber: '',
    registerNumber: '',
    admissionNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    parent: '',
    grade: '',
    section: 'A',
    status: 'Active',
    profileImage: '',
    guardian: {
      name: '',
      relationship: 'Father',
      phone: ''
    },
    finance: {
      totalFees: 0,
      feesPaid: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);

  // Fetch parents on mount
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await fetch(apiUrl('/parents'));
        if (response.ok) {
          const data = await response.json();
          setParents(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchParents();
  }, []);

  // Fetch configured classes dynamically
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(apiUrl('/classes'));
        if (response.ok) {
          const data = await response.json();
          setClasses(data);
          if (data.length > 0 && !isEditMode) {
            setFormData(prev => ({
              ...prev,
              grade: data[0].name
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchStudentData = async () => {
      try {
        setFetching(true);
        const response = await fetch(apiUrl(`/students/${id}`));
        if (!response.ok) throw new Error('Failed to retrieve student details for editing');
        const data = await response.json();
        
        // Format date to YYYY-MM-DD for HTML5 date input
        if (data.dateOfBirth) {
          const dob = new Date(data.dateOfBirth);
          data.dateOfBirth = !isNaN(dob.getTime()) ? dob.toISOString().split('T')[0] : '';
        }
        if (data.admissionDate) {
          const admD = new Date(data.admissionDate);
          data.admissionDate = !isNaN(admD.getTime()) ? admD.toISOString().split('T')[0] : '';
        }
        
        setFormData(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    fetchStudentData();
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple validations
    if (!formData.name || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.address) {
      setError('Please fill in all personal details.');
      setActiveSection('personal');
      setLoading(false);
      return;
    }
    if (!formData.rollNumber || !formData.registerNumber) {
      setError('Please fill in Roll and Register identification numbers.');
      setActiveSection('academic');
      setLoading(false);
      return;
    }
    if (!formData.guardian.name || !formData.guardian.phone) {
      setError('Please fill in Guardian names and contact phones.');
      setActiveSection('guardian');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isEditMode 
        ? apiUrl(`/students/${id}`)
        : apiUrl('/students');
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error occurred saving student profile.');
      }

      // Navigate back to the student's detail view
      const studentId = isEditMode ? id : data.student._id;
      navigate(`/students/${studentId}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="form-loading-container">
        <div className="spinner"></div>
        <p>Fetching student record details...</p>
      </div>
    );
  }

  return (
    <div className="form-page-container">
      <button className="back-btn" onClick={() => navigate(isEditMode ? `/students/${id}` : '/students')}>
        <ChevronLeft size={16} />
        <span>Cancel</span>
      </button>

      <header className="form-header">
        <h1>{isEditMode ? 'Modify Student Folder' : 'Register New Student'}</h1>
        <p>{isEditMode ? 'Make adjustments to academic or contact profiles.' : 'Setup registration and billing accounts for a new student.'}</p>
      </header>

      {error && (
        <div className="form-error-banner glass-panel">
          <ShieldAlert size={20} className="error-banner-icon" />
          <span>{error}</span>
        </div>
      )}

      <div className="form-body-layout">
        {/* Navigation Tabs for Form Sections */}
        <aside className="form-section-nav glass-panel">
          <button 
            type="button"
            className={`section-tab-link ${activeSection === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveSection('personal')}
          >
            <User size={18} />
            <span>Personal Info</span>
          </button>
          <button 
            type="button"
            className={`section-tab-link ${activeSection === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveSection('academic')}
          >
            <BookOpen size={18} />
            <span>Academic Setup</span>
          </button>
          <button 
            type="button"
            className={`section-tab-link ${activeSection === 'guardian' ? 'active' : ''}`}
            onClick={() => setActiveSection('guardian')}
          >
            <Heart size={18} />
            <span>Guardian Info</span>
          </button>
          {!isEditMode && (
            <button 
              type="button"
              className={`section-tab-link ${activeSection === 'finance' ? 'active' : ''}`}
              onClick={() => setActiveSection('finance')}
            >
              <Wallet size={18} />
              <span>Billing Accounts</span>
            </button>
          )}
        </aside>

        {/* Form content box */}
        <form onSubmit={handleSubmit} className="form-content-panel glass-panel">
          
          {/* Section 1: Personal Info */}
          {activeSection === 'personal' && (
            <div className="form-section animated-fade-in">
              <h2>Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-input" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-input" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="e.g. john.doe@edu.in"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone *</label>
                  <input 
                    type="text" 
                    name="phone"
                    className="form-input" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="e.g. +91 98765 43210"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input 
                    type="date" 
                    name="dateOfBirth"
                    className="form-input" 
                    value={formData.dateOfBirth} 
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select 
                    name="gender" 
                    className="form-input" 
                    value={formData.gender} 
                    onChange={handleInputChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Profile Image URL</label>
                  <input 
                    type="text" 
                    name="profileImage"
                    className="form-input" 
                    value={formData.profileImage || ''} 
                    onChange={handleInputChange} 
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Permanent Address *</label>
                  <textarea 
                    name="address"
                    rows="3"
                    className="form-input textarea-input" 
                    value={formData.address} 
                    onChange={handleInputChange}
                    placeholder="Street, City, State, ZIP..."
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Academic Details */}
          {activeSection === 'academic' && (
            <div className="form-section animated-fade-in">
              <h2>Academic Details</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input 
                    type="text" 
                    name="rollNumber"
                    className="form-input" 
                    value={formData.rollNumber} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 10A01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Register Number *</label>
                  <input 
                    type="text" 
                    name="registerNumber"
                    className="form-input" 
                    value={formData.registerNumber} 
                    onChange={handleInputChange} 
                    placeholder="e.g. REG2026G1001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Grade / Class *</label>
                  {classes.length === 0 && !formData.grade ? (
                    <div className="form-input warning-input" style={{ color: 'var(--accent-warning)', borderColor: 'var(--accent-warning)' }}>
                      No classes configured! Go to Classes Settings first.
                    </div>
                  ) : (
                    <select 
                      name="grade" 
                      className="form-input" 
                      value={formData.grade} 
                      onChange={handleInputChange}
                    >
                      {formData.grade && !classes.some(c => c.name === formData.grade) && (
                        <option value={formData.grade}>{formData.grade} (Inactive)</option>
                      )}
                      {classes.map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Section *</label>
                  <select 
                    name="section" 
                    className="form-input" 
                    value={formData.section} 
                    onChange={handleInputChange}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Admission Number</label>
                  <input 
                    type="text" 
                    name="admissionNumber"
                    className="form-input" 
                    value={formData.admissionNumber || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g. ADM-2026-005"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Admission Date</label>
                  <input 
                    type="date" 
                    name="admissionDate"
                    className="form-input" 
                    value={formData.admissionDate || ''} 
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Link Parent Record</label>
                  <select
                    name="parent"
                    className="form-input"
                    value={formData.parent || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">-- No linked parent record --</option>
                    {parents.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.fatherName} & {p.motherName} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {isEditMode && (
                  <div className="form-group">
                    <label className="form-label">Enrollment Status *</label>
                    <select 
                      name="status" 
                      className="form-input" 
                      value={formData.status} 
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Guardian Details */}
          {activeSection === 'guardian' && (
            <div className="form-section animated-fade-in">
              <h2>Guardian Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Guardian Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.guardian.name} 
                    onChange={(e) => handleNestedInputChange('guardian', 'name', e.target.value)} 
                    placeholder="e.g. Robert Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Relationship *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.guardian.relationship} 
                    onChange={(e) => handleNestedInputChange('guardian', 'relationship', e.target.value)} 
                    placeholder="e.g. Father, Mother, Uncle"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Guardian Phone Number *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.guardian.phone} 
                    onChange={(e) => handleNestedInputChange('guardian', 'phone', e.target.value)} 
                    placeholder="e.g. +91 98765 43219"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Finance (Creation Mode Only) */}
          {activeSection === 'finance' && !isEditMode && (
            <div className="form-section animated-fade-in">
              <h2>Initial Fee Structuring</h2>
              <p className="section-disclaimer">Set the base fee configuration. Outstanding dues are computed dynamically.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Total Fee Amount (INR) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.finance.totalFees} 
                    onChange={(e) => handleNestedInputChange('finance', 'totalFees', Number(e.target.value))} 
                    placeholder="e.g. 120000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Paid Amount (INR) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.finance.feesPaid} 
                    onChange={(e) => handleNestedInputChange('finance', 'feesPaid', Number(e.target.value))} 
                    placeholder="e.g. 60000"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="form-footer-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                // simple stepper logic
                if (activeSection === 'finance') setActiveSection('guardian');
                else if (activeSection === 'guardian') setActiveSection('academic');
                else if (activeSection === 'academic') setActiveSection('personal');
                else navigate(isEditMode ? `/students/${id}` : '/students');
              }}
            >
              Back
            </button>

            <button 
              type="button" 
              className="btn btn-secondary next-step-btn"
              onClick={() => {
                if (activeSection === 'personal') setActiveSection('academic');
                else if (activeSection === 'academic') setActiveSection('guardian');
                else if (activeSection === 'guardian' && !isEditMode) setActiveSection('finance');
                else document.getElementById('submit-btn').click(); // trigger form submission
              }}
            >
              {activeSection === 'finance' || (activeSection === 'guardian' && isEditMode) ? 'Review & Submit' : 'Next Step'}
            </button>
            <button type="submit" id="submit-btn" style={{ display: 'none' }}></button>
            
            {(activeSection === 'finance' || (activeSection === 'guardian' && isEditMode)) && (
              <button type="submit" className="btn btn-primary submit-active-btn" disabled={loading}>
                <Save size={16} />
                <span>{loading ? 'Saving...' : 'Save Profile'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
