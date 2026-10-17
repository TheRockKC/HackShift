import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { schemeApi } from '../api/client';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Save,
  LandPlot,
} from 'lucide-react';

export default function SchemeSaathiView() {
  const { userId, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('browse'); // 'browse' | 'matcher'

  // Browse State
  const [schemes, setSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    state: '',
  });

  // Matcher State
  const [matcherFarmerId, setMatcherFarmerId] = useState(userId);
  const [matchResults, setMatchResults] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    primary_crop_type: 'wheat',
    has_irrigation: true,
    has_kcc: false,
    social_category: 'general',
    gender: 'male',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync userId
  useEffect(() => {
    setMatcherFarmerId(userId);
  }, [userId]);

  // Fetch Schemes
  const fetchSchemes = useCallback(async () => {
    setLoadingSchemes(true);
    try {
      const res = await schemeApi.getSchemes(filters);
      setSchemes(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      showToast(`Failed to load schemes: ${err.message}`, 'error');
    } finally {
      setLoadingSchemes(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Handle Find Matches
  const handleFindMatches = async (e) => {
    if (e) e.preventDefault();
    setLoadingMatches(true);
    try {
      const res = await schemeApi.getFarmerMatches(matcherFarmerId);
      setMatchResults(res);
      showToast(`Evaluated scheme eligibility for Farmer #${matcherFarmerId}!`, 'success');
    } catch (err) {
      showToast(`Eligibility check failed: ${err.message}`, 'error');
    } finally {
      setLoadingMatches(false);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await schemeApi.updateFarmerProfile(matcherFarmerId, {
        primary_crop_type: profileForm.primary_crop_type || null,
        has_irrigation: Boolean(profileForm.has_irrigation),
        has_kcc: Boolean(profileForm.has_kcc),
        social_category: profileForm.social_category || null,
        gender: profileForm.gender || null,
      });
      showToast('Farmer profile updated! Re-evaluating matches...', 'success');
      handleFindMatches();
    } catch (err) {
      showToast(`Failed to update profile: ${err.message}`, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="module-view-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div className="view-icon-badge bg-purple">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="view-title">SchemeSaathi Government Portal</h2>
            <p className="view-desc">
              Privacy-first welfare discovery matching genuine Central & State agriculture schemes based on landholding and farm attributes.
            </p>
          </div>
        </div>

        <div className="view-actions sub-tabs-bar">
          <button
            type="button"
            className={`btn ${activeSubTab === 'browse' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('browse')}
          >
            <BookOpen size={16} />
            <span>Scheme Catalogue</span>
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'matcher' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('matcher')}
          >
            <Sparkles size={16} />
            <span>Check My Eligibility</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: SCHEME DIRECTORY */}
      {activeSubTab === 'browse' && (
        <>
          <div className="filter-bar">
            <div className="filter-group">
              <Search size={16} className="filter-icon" />
              <input
                type="text"
                className="filter-input"
                placeholder="Search schemes (PM-KISAN, PMFBY, subsidy, credit)..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>

            <div className="filter-group select-group">
              <select
                className="filter-select"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="direct_income_support">Direct Income Support</option>
                <option value="crop_insurance">Crop Insurance</option>
                <option value="farm_mechanization">Farm Mechanization (SMAM)</option>
                <option value="credit">Credit & Loans (KCC)</option>
                <option value="irrigation">Irrigation</option>
              </select>
            </div>

            <div className="filter-group">
              <Filter size={16} className="filter-icon" />
              <input
                type="text"
                className="filter-input"
                placeholder="Filter by State applicability..."
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              />
            </div>
          </div>

          <div className="content-card">
            <div className="card-header-bar">
              <h3>Verified Government Schemes ({totalCount})</h3>
              <span className="badge-tag">Official Gazettes</span>
            </div>

            {loadingSchemes ? (
              <div className="loading-state">
                <RefreshCw size={24} className="spin" />
                <p>Loading scheme catalogue...</p>
              </div>
            ) : schemes.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} className="empty-icon" />
                <h4>No matching government schemes</h4>
                <p>Try broadening your search query or removing category filters.</p>
              </div>
            ) : (
              <div className="schemes-grid">
                {schemes.map((s) => (
                  <div key={s.id} className="scheme-card">
                    <div className="scheme-card-top">
                      <span className="category-pill">{s.category?.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="state-pill">{s.state_applicability || 'All India'}</span>
                    </div>

                    <h4 className="scheme-name">{s.name}</h4>
                    <span className="scheme-ministry">{s.nodal_ministry}</span>

                    <p className="scheme-desc">{s.short_description}</p>

                    <div className="scheme-benefits-box">
                      <strong className="benefits-heading">Benefits:</strong>
                      <p className="benefits-body">{s.benefits_summary}</p>
                    </div>

                    <div className="scheme-card-footer">
                      {s.official_portal_url && (
                        <a
                          href={s.official_portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          <span>Official Portal</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* SUB-VIEW 2: ELIGIBILITY MATCHER */}
      {activeSubTab === 'matcher' && (
        <div className="two-column-layout">
          {/* Left Column: Matcher Input & Profile */}
          <div className="content-card form-column">
            <div className="card-header-bar">
              <h3>Farmer Profile & Land Records</h3>
              <span className="privacy-badge">
                <ShieldCheck size={14} /> Zero PII Required
              </span>
            </div>

            <div className="privacy-notice">
              <p>
                SchemeSaathi matches you using your <strong>registered farm landholding</strong> and voluntary agronomic preferences.
                We never store Aadhaar, PAN, or banking numbers.
              </p>
            </div>

            <form onSubmit={handleFindMatches} className="matcher-form">
              <div className="form-group">
                <label>Farmer User ID</label>
                <div className="id-action-row">
                  <input
                    type="number"
                    required
                    value={matcherFarmerId}
                    onChange={(e) => setMatcherFarmerId(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loadingMatches}>
                    {loadingMatches ? (
                      <RefreshCw size={16} className="spin" />
                    ) : (
                      <>
                        <Sparkles size={16} /> Evaluate Matches
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <hr className="divider" />

            <div className="card-header-bar">
              <h4>Optional Matching Attributes</h4>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-group">
                <label>Primary Cultivated Crop</label>
                <input
                  type="text"
                  placeholder="e.g. Wheat, Paddy, Cotton"
                  value={profileForm.primary_crop_type}
                  onChange={(e) => setProfileForm({ ...profileForm, primary_crop_type: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Irrigation Access</label>
                  <select
                    value={profileForm.has_irrigation ? 'yes' : 'no'}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, has_irrigation: e.target.value === 'yes' })
                    }
                  >
                    <option value="yes">Yes (Tubewell / Canal)</option>
                    <option value="no">No (Rainfed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Kisan Credit Card (KCC)</label>
                  <select
                    value={profileForm.has_kcc ? 'yes' : 'no'}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, has_kcc: e.target.value === 'yes' })
                    }
                  >
                    <option value="no">Not Yet Issued</option>
                    <option value="yes">Active KCC Holder</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Social Category</label>
                  <select
                    value={profileForm.social_category}
                    onChange={(e) => setProfileForm({ ...profileForm, social_category: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">Scheduled Caste (SC)</option>
                    <option value="st">Scheduled Tribe (ST)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-outline btn-block" disabled={savingProfile}>
                {savingProfile ? (
                  <RefreshCw size={16} className="spin" />
                ) : (
                  <>
                    <Save size={16} /> Save Attributes & Recheck
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Match Results Display */}
          <div className="content-card result-column">
            <div className="card-header-bar">
              <h3>Eligibility Evaluation Results</h3>
              {matchResults && (
                <span className="timestamp-badge">Farmer #{matcherFarmerId}</span>
              )}
            </div>

            {!matchResults ? (
              <div className="empty-state">
                <UserCheck size={48} className="empty-icon text-purple" />
                <h4>Check Scheme Eligibility</h4>
                <p>Click "Evaluate Matches" to check potential welfare schemes for this farmer.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleFindMatches()}
                >
                  Run Match Engine
                </button>
              </div>
            ) : (
              <div className="matches-display">
                {/* Farmer Registered Landholding Banner */}
                <div className="landholding-card">
                  <LandPlot size={20} className="text-purple" />
                  <div>
                    <span className="land-label">Registered Aggregated Landholding</span>
                    <strong className="land-val">
                      {matchResults.total_registered_acres !== null &&
                      matchResults.total_registered_acres !== undefined
                        ? `${Number(matchResults.total_registered_acres).toFixed(2)} Acres (${matchResults.total_registered_farms || 0} registered farms)`
                        : 'No farm parcel registered yet'}
                    </strong>
                  </div>
                </div>

                <h4 className="matches-subheading">
                  Matched Schemes ({matchResults.matches?.length || 0})
                </h4>

                <div className="matches-list">
                  {matchResults.matches?.map((m) => (
                    <div key={m.scheme_id} className="match-result-card">
                      <div className="match-top">
                        <span className="scheme-title">{m.name}</span>
                        <span className="match-pill potential">{m.match_status?.toUpperCase() || 'POTENTIAL MATCH'}</span>
                      </div>

                      {/* Reasons Why Farmer Qualifies */}
                      {m.match_reasons && m.match_reasons.length > 0 && (
                        <div className="qualifying-reasons">
                          <strong className="reasons-label">
                            <CheckCircle2 size={14} className="text-success" /> Why You Qualify:
                          </strong>
                          <ul>
                            {m.match_reasons.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Information / Verification hints */}
                      {m.missing_information && m.missing_information.length > 0 && (
                        <div className="missing-info-box">
                          <strong className="missing-label">
                            <HelpCircle size={14} className="text-amber" /> Verification Checklist:
                          </strong>
                          <ul>
                            {m.missing_information.map((info, idx) => (
                              <li key={idx}>{info}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {m.official_portal_url && (
                        <a
                          href={m.official_portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-link portal-link"
                        >
                          Visit Official Portal <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
