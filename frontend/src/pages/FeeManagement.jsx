import React, { useState, useEffect } from 'react';
import { Landmark, Coins, Search, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './FeeManagement.css';

const FeeManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expanded payment entry row state (studentId)
  const [expandedId, setExpandedId] = useState(null);
  
  // Inline payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl('/students'));
      if (!response.ok) throw new Error('Failed to load billing records');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  }, []);

  const handleRecordPaymentClick = (student) => {
    if (expandedId === student._id) {
      setExpandedId(null);
    } else {
      setExpandedId(student._id);
      setPayAmount('');
      setPayMethod('Bank Transfer');
      setSuccessMsg('');
    }
  };

  const handlePaymentSubmit = async (e, student) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;

    try {
      setSubmittingPayment(true);
      setError(null);
      setSuccessMsg('');

      const amt = Number(payAmount);
      const response = await fetch(apiUrl(`/student-portal/${student._id}/payments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, paymentMethod: payMethod })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment processing failed');

      setSuccessMsg(`Recorded payment of ${amt.toLocaleString()} INR for ${student.name} successfully!`);
      setExpandedId(null);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Compute summary financial totals
  const totalExpected = students.reduce((sum, s) => sum + (s.finance?.totalFees || 0), 0);
  const totalCollected = students.reduce((sum, s) => sum + (s.finance?.feesPaid || 0), 0);
  const totalOutstanding = totalExpected - totalCollected;

  // Filter students based on search query
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.grade && s.grade.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fees-container">
      <header className="fees-header">
        <div>
          <h1>Financial Accounts</h1>
          <p>Centralized ledger of expected fees, student collections, and payment history.</p>
        </div>
      </header>

      {error && (
        <div className="form-error-banner glass-panel">
          <ShieldAlert size={20} className="error-banner-icon" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="form-success-banner glass-panel">
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="fees-stats-grid">
        <div className="glass-panel fee-stat-card">
          <div className="fee-stat-info">
            <h3>Total Expected Revenue</h3>
            <p>{totalExpected.toLocaleString()} INR</p>
          </div>
          <div className="fee-stat-icon-wrapper expected">
            <Landmark size={24} />
          </div>
        </div>

        <div className="glass-panel fee-stat-card">
          <div className="fee-stat-info">
            <h3>Total Collected Fees</h3>
            <p>{totalCollected.toLocaleString()} INR</p>
          </div>
          <div className="fee-stat-icon-wrapper paid">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="glass-panel fee-stat-card">
          <div className="fee-stat-info">
            <h3>Outstanding Arrears</h3>
            <p>{totalOutstanding.toLocaleString()} INR</p>
          </div>
          <div className="fee-stat-icon-wrapper outstanding">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* Roster Balance Sheet */}
      <div className="glass-panel billing-panel">
        <h2>Student Fee Balances</h2>
        
        <div className="billing-search-bar">
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search student balances by name, roll number or class..."
              className="directory-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="class-loading">
            <div className="spinner"></div>
            <p>Fetching financial records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="class-empty">
            <p>No billing records found matching your search.</p>
          </div>
        ) : (
          <div className="gradebook-table-wrapper">
            <table className="gradebook-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Grade</th>
                  <th style={{ textAlign: 'right' }}>Total Fee (INR)</th>
                  <th style={{ textAlign: 'right' }}>Paid (INR)</th>
                  <th style={{ textAlign: 'right' }}>Balance (INR)</th>
                  <th style={{ textAlign: 'center' }}>Billing Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const total = student.finance?.totalFees || 0;
                  const paid = student.finance?.feesPaid || 0;
                  const bal = total - paid;
                  const isExpanded = expandedId === student._id;

                  return (
                    <React.Fragment key={student._id}>
                      <tr className={isExpanded ? 'payment-row-expanded' : ''}>
                        <td style={{ fontWeight: 600 }}>{student.rollNumber}</td>
                        <td>{student.name}</td>
                        <td>{student.grade} - {student.section}</td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>{total.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-success)', fontWeight: 500 }}>{paid.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: bal > 0 ? 'var(--accent-danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {bal.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${bal > 0 ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleRecordPaymentClick(student)}
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            {isExpanded ? 'Close' : bal > 0 ? 'Collect Payment' : 'View History'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" style={{ padding: 0 }}>
                            <div className="payment-inline-form glass-panel" style={{ borderRadius: 0, border: 'none', background: 'hsla(222, 25%, 8%, 0.4)' }}>
                              <form onSubmit={(e) => handlePaymentSubmit(e, student)} style={{ display: 'flex', gap: '20px', width: '100%', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                  <label className="form-label">Collect Amount (INR) *</label>
                                  {bal > 0 ? (
                                    <input
                                      type="number"
                                      min="1"
                                      max={bal}
                                      className="form-input"
                                      value={payAmount}
                                      onChange={(e) => setPayAmount(e.target.value)}
                                      placeholder={`Max ${bal}`}
                                      required
                                    />
                                  ) : (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', display: 'block', padding: '12px 0' }}>
                                      Fees Fully Settled!
                                    </span>
                                  )}
                                </div>
                                {bal > 0 && (
                                  <>
                                    <div className="form-group" style={{ flex: 1 }}>
                                      <label className="form-label">Payment Mode *</label>
                                      <select
                                        className="form-input"
                                        value={payMethod}
                                        onChange={(e) => setPayMethod(e.target.value)}
                                      >
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Card">Card</option>
                                        <option value="Cash">Cash</option>
                                      </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ height: '45px' }} disabled={submittingPayment}>
                                      Submit Receipt
                                    </button>
                                  </>
                                )}
                              </form>

                              {/* Historical Receipts */}
                              <div style={{ marginTop: '16px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                  Payment History Receipt Ledger
                                </span>
                                {student.finance?.paymentHistory && student.finance.paymentHistory.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {student.finance.paymentHistory.map((h, hidx) => (
                                      <div key={hidx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '6px 10px', background: 'hsla(222, 20%, 25%, 0.1)', borderRadius: '4px' }}>
                                        <span>Collected <strong>{h.amount.toLocaleString()} INR</strong> via {h.paymentMethod}</span>
                                        <span>{new Date(h.date).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No payment receipts recorded yet.</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeManagement;
