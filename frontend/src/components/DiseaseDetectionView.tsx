import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { diseaseApi } from '../api/client';
import {
  ScanLine,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
  Leaf,
  Layers,
  ChevronRight,
  ExternalLink,
  Trash2,
  X,
  ArrowLeft,
} from 'lucide-react';
import {
  SupportedCrop,
  DiseaseDiagnosisResult,
  DiseaseDetectionHistoryItem,
} from '../types';
import { getTreatmentForClass, DetailedTreatmentInfo } from '../data/treatmentCatalog';

const CROP_GUIDES: Record<SupportedCrop, {
  name: string;
  hindiName: string;
  conditions: string[];
  photoTips: string[];
  photoTipsHindi: string[];
}> = {
  tomato: {
    name: 'Tomato',
    hindiName: 'टमाटर',
    conditions: [
      'Early Blight (Alternaria solani)',
      'Late Blight (Phytophthora infestans)',
      'Septoria Leaf Spot',
      'Bacterial Spot (Xanthomonas)',
      'Target Spot (Corynespora)',
      'Yellow Leaf Curl Virus',
      'Mosaic Virus',
      'Leaf Mold (Passalora fulva)',
      'Two-Spotted Spider Mites',
      'Healthy Tomato Leaf',
    ],
    photoTips: [
      'Focus on the upper and lower surface of leaflets showing spots or lesions',
      'Ensure bright daylight without shadows or flash glare',
      'Hold leaf blade flat for crisp focus',
    ],
    photoTipsHindi: [
      'पत्ते की ऊपरी और निचली सतह पर जहां धब्बे या सड़न दिख रही हो, वहां स्पष्ट फोकस रखें',
      'फोटो दिन की प्राकृतिक रोशनी में लें, छाया या फ्लैश की चमक से बचें',
      'पत्ते को हथेली या सपाट सतह पर सीधा रखकर फोटो खींचें',
    ],
  },
  wheat: {
    name: 'Wheat',
    hindiName: 'गेहूं',
    conditions: [
      'Wheat Blast (Magnaporthe oryzae)',
      'Yellow / Stripe Rust (Puccinia striiformis)',
      'Brown / Leaf Rust (Puccinia triticina)',
      'Black / Stem Rust (Puccinia graminis)',
      'Loose Smut (Ustilago tritici)',
      'Powdery Mildew (Blumeria graminis)',
      'Septoria Leaf Blotch',
      'Healthy Wheat Leaf',
    ],
    photoTips: [
      'Photograph active rust pustules or elongated lesions closely',
      'Hold the wheat blade steady against your palm or neutral ground',
      'Capture both infected and border green tissues for contrast',
    ],
    photoTipsHindi: [
      'गेहूं की पत्ती पर पीले या भूरे रतुआ (Rust) के दानों को नज़दीक से केंद्रित करें',
      'पत्ती को स्थिर रखकर दोनों किनारों के घावों को स्पष्ट लें',
      'संक्रमित हिस्से और स्वस्थ हरे हिस्से दोनों को एक साथ फ्रेम में रखें',
    ],
  },
  rice: {
    name: 'Rice (Paddy)',
    hindiName: 'धान / चावल',
    conditions: [
      'Rice Blast (Pyricularia oryzae)',
      'Bacterial Leaf Blight (Xanthomonas oryzae)',
      'Brown Spot (Bipolaris oryzae)',
      'Rice Tungro Virus',
      'Leaf Scald (Microdochium oryzae)',
      'Healthy Paddy Leaf',
    ],
    photoTips: [
      'Frame spindle-shaped blast lesions or wavy margin blight',
      'Wipe excess moisture or mud off the leaf before capturing',
      'Capture individual infected tillers in sharp focus',
    ],
    photoTipsHindi: [
      'ब्लास्ट रोग के नाव के आकार के धब्बों या झुलसा रोग के किनारों को केंद्रित करें',
      'फोटो लेने से पहले पत्ती पर से अधिक पानी की बूंदें या मिट्टी साफ कर लें',
      'संक्रमित कल्ले (Tiller) की पत्ती को सीधे दिन के उजाले में फोटो खींचें',
    ],
  },
};

export default function DiseaseDetectionView() {
  const { t, userId, farmId, showToast, language } = useApp();

  const [selectedCrop, setSelectedCrop] = useState<SupportedCrop>('tomato');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Inference state
  const [loading, setLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiseaseDiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewCondition, setPreviewCondition] = useState<string | null>(null);

  // Model Asset Status
  const [assetStatus, setAssetStatus] = useState<any>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Diagnosis History
  const [historyItems, setHistoryItems] = useState<DiseaseDetectionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyCropFilter, setHistoryCropFilter] = useState<'current' | 'all'>('current');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch ML Asset Status & History on Mount
  useEffect(() => {
    fetchAssetStatus();
    fetchHistory();
  }, []);

  const fetchAssetStatus = async () => {
    setLoadingAssets(true);
    try {
      const data = await diseaseApi.getAssetsStatus();
      setAssetStatus(data);
    } catch (err: any) {
      console.warn('Could not fetch ML asset status:', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await diseaseApi.getDetections({ page: 1, page_size: 10 });
      if (data && Array.isArray(data.items)) {
        setHistoryItems(data.items);
      }
    } catch (err: any) {
      console.warn('Could not fetch diagnosis history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (file: File) => {
    setError(null);
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setError('Please upload a valid image file (.jpg, .jpeg, .png, or .webp).');
      return;
    }
    // Validate size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      setError('Image file exceeds maximum allowed size of 15 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setDiagnosisResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setDiagnosisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRunDiagnosis = async () => {
    if (!selectedFile) {
      setError('Please select or upload a leaf photograph first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('crop', selectedCrop);
      formData.append('file', selectedFile, selectedFile.name);
      const safeFarmId = (farmId && Number(farmId) <= 4 && Number(farmId) >= 1) ? Number(farmId) : 1;
      const safeFarmerId = (userId && Number(userId) <= 4 && Number(userId) >= 1) ? Number(userId) : 1;
      formData.append('farm_id', String(safeFarmId));
      formData.append('farmer_id', String(safeFarmerId));

      const response: DiseaseDiagnosisResult = await diseaseApi.detectDisease(formData);
      setDiagnosisResult(response);
      showToast('Diagnosis successfully completed!', 'success');
      // Refresh history
      fetchHistory();
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      const msg = err.message || 'Diagnosis failed. The ML backend was unable to evaluate the image.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeGuide = CROP_GUIDES[selectedCrop] || CROP_GUIDES.tomato;

  const filteredHistory = historyItems.filter((item) => {
    if (historyCropFilter === 'all') return true;
    const lower = item.predicted_class.toLowerCase();
    return lower.startsWith(selectedCrop.toLowerCase());
  });

  return (
    <div className="disease-view-container">
      {/* Header Banner */}
      <div className="disease-header-block">
        <div className="header-badge-row">
          <span className="badge-ai-model">
            <Sparkles size={14} /> {language === 'hi' ? 'मोबाइलनेट V2 डीप लर्निंग' : 'MobileNetV2 Deep Learning'}
          </span>
          <span className="badge-models-ready">
            <CheckCircle2 size={13} /> {language === 'hi' ? `${activeGuide.emoji} ${activeGuide.hindiName} मॉडल सक्रिय` : `${activeGuide.emoji} ${activeGuide.name} Model Active`}
          </span>
        </div>
        <h1 className="disease-view-title">{t('diseaseDetectionHeading')}</h1>
        <p className="disease-view-subtitle">{t('diseaseDetectionSub')}</p>
      </div>

      <div className="disease-workspace-grid">
        {/* Left Column: Image Upload & Crop Selector */}
        <div className="disease-input-card">
          {/* Crop Selector Buttons */}
          <div className="crop-selector-group">
            <label className="input-group-label">{t('selectCrop')}</label>
            <div className="crop-options-grid">
              <button
                type="button"
                className={`crop-select-pill ${selectedCrop === 'tomato' ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedCrop('tomato');
                  setDiagnosisResult(null);
                  setPreviewCondition(null);
                }}
              >
                <Leaf size={18} style={{ color: selectedCrop === 'tomato' ? '#059669' : '#64748b' }} />
                <span className="crop-name-label">{t('cropTomato')}</span>
              </button>

              <button
                type="button"
                className={`crop-select-pill ${selectedCrop === 'wheat' ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedCrop('wheat');
                  setDiagnosisResult(null);
                  setPreviewCondition(null);
                }}
              >
                <Leaf size={18} style={{ color: selectedCrop === 'wheat' ? '#059669' : '#64748b' }} />
                <span className="crop-name-label">{t('cropWheat')}</span>
              </button>

              <button
                type="button"
                className={`crop-select-pill ${selectedCrop === 'rice' ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedCrop('rice');
                  setDiagnosisResult(null);
                  setPreviewCondition(null);
                }}
              >
                <Leaf size={18} style={{ color: selectedCrop === 'rice' ? '#059669' : '#64748b' }} />
                <span className="crop-name-label">{t('cropRice')}</span>
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div className="upload-section-block">
            <label className="input-group-label">{t('uploadLeafPhoto')}</label>

            {!imagePreviewUrl ? (
              <div
                className={`upload-dropzone ${isDragging ? 'dragging-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <div className="dropzone-icon-circle">
                  <Upload size={32} className="upload-arrow-icon" />
                </div>
                <div className="dropzone-instruction-title">{t('dragAndDrop')}</div>
                <p className="dropzone-formats-note">{t('supportedFormats')}</p>
                <button type="button" className="browse-files-btn">
                  {t('browseLeafPhotos')}
                </button>
              </div>
            ) : (
              <div className="image-preview-wrapper">
                <div className="preview-image-container">
                  <img src={imagePreviewUrl} alt="Leaf preview for diagnosis" className="preview-leaf-img" />
                  <button
                    type="button"
                    className="remove-img-btn"
                    onClick={handleRemoveImage}
                    title={t('removeImage')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="preview-meta-row">
                  <span className="file-name-text">{selectedFile?.name}</span>
                  <span className="file-size-text">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                  </span>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('changeImage')}
                  </button>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Action Button & Error Messages */}
          {error && (
            <div className="error-alert-box">
              <AlertTriangle size={18} className="error-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <div className="submit-action-area">
            <button
              type="button"
              className={`run-diagnosis-button ${loading ? 'is-loading' : ''}`}
              onClick={handleRunDiagnosis}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  <span>{t('diagnosing')}</span>
                </>
              ) : (
                <>
                  <ScanLine size={18} />
                  <span>{t('runDiagnosis')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Diagnostic Results Card or Empty Guidance */}
        <div className="disease-output-card">
          {diagnosisResult ? (() => {
            const treatmentInfo = getTreatmentForClass(diagnosisResult.predicted_class);
            const isHealthy =
              diagnosisResult.predicted_class.toLowerCase().includes('healthy') ||
              diagnosisResult.treatment?.status === 'healthy';
            const actionPlan =
              diagnosisResult.treatment?.recommendation ||
              diagnosisResult.treatment?.preliminary_guidance ||
              treatmentInfo.primaryRecommendation;

            return (
              <div className="diagnosis-result-sheet">
                {/* Top Result Banner */}
                <div className="result-top-banner">
                  <div className="result-crop-tag">
                    <Leaf size={14} />
                    <span className="crop-tag-text">{diagnosisResult.crop.toUpperCase()}</span>
                  </div>
                  <div className="result-date-tag">
                    <Clock size={13} />
                    <span>{new Date(diagnosisResult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Identified Condition Header */}
                <div className="condition-highlight-row">
                  <div>
                    <span className="condition-kicker-label">{t('predictedDisease')}</span>
                    <h2 className="condition-main-name">
                      {treatmentInfo.diseaseName || diagnosisResult.treatment.disease_name || diagnosisResult.predicted_class.replace(/___/g, ' - ').replace(/_/g, ' ')}
                    </h2>
                    {treatmentInfo.hindiName && (
                      <div style={{ fontSize: '0.95rem', color: '#047857', fontWeight: 650, marginTop: '2px' }}>
                        {treatmentInfo.hindiName}
                      </div>
                    )}
                  </div>
                  <div className="confidence-meter-card">
                    <div className="confidence-percent-value">
                      {(Number(diagnosisResult.confidence) * 100).toFixed(1)}%
                    </div>
                    <div className="confidence-label-text">{t('confidenceScore')}</div>
                  </div>
                </div>

                {/* Pathogen and Severity Meta Row */}
                <div className="pathogen-meta-row">
                  <span className={`severity-pill severity-${treatmentInfo.severity.toLowerCase()}`}>
                    {t('severityLabel')}: {treatmentInfo.severity}
                  </span>
                  {treatmentInfo.pathogen && treatmentInfo.pathogen !== 'None' && (
                    <span className="pathogen-pill">
                      {t('pathogenLabel')}: {treatmentInfo.pathogen}
                    </span>
                  )}
                </div>

                {/* Top Hypotheses Breakdown */}
                {diagnosisResult.top_predictions && diagnosisResult.top_predictions.length > 0 && (
                  <div className="top-hypotheses-box">
                    <h4 className="hypotheses-title">{t('topPredictions')}</h4>
                    <div className="hypotheses-list">
                      {diagnosisResult.top_predictions.map((p, idx) => {
                        const scorePercent = (p.score * 100).toFixed(1);
                        return (
                          <div key={idx} className="hypothesis-bar-row">
                            <div className="hypothesis-info">
                              <span className="hypo-rank">{idx + 1}.</span>
                              <span className="hypo-name">{p.class_name.replace(/___/g, ' - ').replace(/_/g, ' ')}</span>
                            </div>
                            <div className="hypo-bar-container">
                              <div className="hypo-bar-fill" style={{ width: `${Math.max(Number(scorePercent), 3)}%` }} />
                            </div>
                            <span className="hypo-percent">{scorePercent}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Primary Action Plan Card */}
                {actionPlan && (
                  <div className="treatment-plan-card">
                    <div className="treatment-plan-header">
                      <h4 className="treatment-plan-title">
                        <Sparkles size={16} /> {t('treatmentPlan')}
                      </h4>
                    </div>
                    <p className="primary-recommendation-text">{actionPlan}</p>
                  </div>
                )}

                {/* Symptoms */}
                {(diagnosisResult.treatment?.symptoms || treatmentInfo.symptoms) && (
                  <div className="treatment-section-card">
                    <h4 className="section-subtitle-tag">{t('symptoms')}</h4>
                    <p className="treatment-body-text">{diagnosisResult.treatment?.symptoms || treatmentInfo.symptoms}</p>
                  </div>
                )}

                {/* Approved Chemical Pesticides & Dosages */}
                {treatmentInfo.chemicalPesticides && treatmentInfo.chemicalPesticides.length > 0 && !isHealthy && (
                  <div className="treatment-section-card chemical-box">
                    <h4 className="section-subtitle-tag amber-tag">
                      <AlertTriangle size={16} /> {t('chemicalPesticides')}
                    </h4>
                    <div className="pesticides-list-grid">
                      {treatmentInfo.chemicalPesticides.map((pest, i) => (
                        <div key={i} className="pesticide-item-card">
                          <div className="pesticide-item-header">
                            <span className="pesticide-item-name">{pest.tradeName}</span>
                            <span className="pesticide-dosage-badge">
                              {pest.dosage}
                            </span>
                          </div>
                          <div className="pesticide-ingredient-line">
                            <strong>{t('activeIngredientLabel')}:</strong> {pest.activeIngredient}
                          </div>
                          <div className="pesticide-interval-line">
                            <Clock size={13} /> {t('sprayIntervalLabel')}: {pest.sprayInterval}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certified Organic & Biological Remedies */}
                {treatmentInfo.organicRemedies && treatmentInfo.organicRemedies.length > 0 && (
                  <div className="treatment-section-card organic-box">
                    <h4 className="section-subtitle-tag green-tag">
                      <CheckCircle2 size={16} /> {t('organicRemedies')}
                    </h4>
                    <div className="organic-items-grid">
                      {treatmentInfo.organicRemedies.map((org, i) => (
                        <div key={i} className="organic-item-card">
                          <div className="organic-item-name-row">
                            <span className="organic-item-name">{org.treatment}</span>
                            <span className="organic-dosage-badge">{org.dosage}</span>
                          </div>
                          <div className="organic-method-line">{org.method}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cultural & Preventive Practices */}
                {((diagnosisResult.treatment?.cultural_practices && diagnosisResult.treatment.cultural_practices.length > 0) ||
                  (treatmentInfo.culturalPractices && treatmentInfo.culturalPractices.length > 0)) && (
                  <div className="treatment-section-card">
                    <h4 className="section-subtitle-tag">{t('culturalMeasures')}</h4>
                    <ul className="bullet-recommendations-list">
                      {(diagnosisResult.treatment?.cultural_practices || treatmentInfo.culturalPractices).map((prac: string, i: number) => (
                        <li key={i}>{prac}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expert Review Advisory */}
                <div className="expert-advisory-warning">
                  <ShieldAlert size={22} className="warning-shield-icon" />
                  <p className="advisory-warning-text">{t('expertWarning')}</p>
                </div>
              </div>
            );
          })() : previewCondition ? (() => {
            const previewInfo = getTreatmentForClass(previewCondition);
            const isHealthy = previewCondition.toLowerCase().includes('healthy');

            return (
              <div className="diagnosis-result-sheet">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 650,
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewCondition(null)}
                  >
                    <ArrowLeft size={14} /> {t('backToGuide')}
                  </button>

                  <div className="result-crop-tag">
                    <Leaf size={14} />
                    <span className="crop-tag-text">{selectedCrop.toUpperCase()} REFERENCE</span>
                  </div>
                </div>

                <div className="condition-highlight-row">
                  <div>
                    <span className="condition-kicker-label">{t('previewConditionTitle')}</span>
                    <h2 className="condition-main-name">{previewInfo.diseaseName}</h2>
                    {previewInfo.hindiName && (
                      <div style={{ fontSize: '0.95rem', color: '#047857', fontWeight: 650, marginTop: '2px' }}>
                        {previewInfo.hindiName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pathogen-meta-row">
                  <span className={`severity-pill severity-${previewInfo.severity.toLowerCase()}`}>
                    {t('severityLabel')}: {previewInfo.severity}
                  </span>
                  {previewInfo.pathogen && previewInfo.pathogen !== 'None' && (
                    <span className="pathogen-pill">
                      {t('pathogenLabel')}: {previewInfo.pathogen}
                    </span>
                  )}
                </div>

                {/* Action Plan */}
                <div className="treatment-plan-card">
                  <div className="treatment-plan-header">
                    <h4 className="treatment-plan-title">
                      <Sparkles size={16} /> {t('treatmentPlan')}
                    </h4>
                  </div>
                  <p className="primary-recommendation-text">{previewInfo.primaryRecommendation}</p>
                </div>

                {/* Symptoms */}
                {previewInfo.symptoms && (
                  <div className="treatment-section-card">
                    <h4 className="section-subtitle-tag">{t('symptoms')}</h4>
                    <p className="treatment-body-text">{previewInfo.symptoms}</p>
                  </div>
                )}

                {/* Chemical Pesticides */}
                {previewInfo.chemicalPesticides && previewInfo.chemicalPesticides.length > 0 && !isHealthy && (
                  <div className="treatment-section-card chemical-box">
                    <h4 className="section-subtitle-tag amber-tag">
                      <AlertTriangle size={16} /> {t('chemicalPesticides')}
                    </h4>
                    <div className="pesticides-list-grid">
                      {previewInfo.chemicalPesticides.map((pest, i) => (
                        <div key={i} className="pesticide-item-card">
                          <div className="pesticide-item-header">
                            <span className="pesticide-item-name">{pest.tradeName}</span>
                            <span className="pesticide-dosage-badge">
                              {pest.dosage}
                            </span>
                          </div>
                          <div className="pesticide-ingredient-line">
                            <strong>{t('activeIngredientLabel')}:</strong> {pest.activeIngredient}
                          </div>
                          <div className="pesticide-interval-line">
                            <Clock size={13} /> {t('sprayIntervalLabel')}: {pest.sprayInterval}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organic Remedies */}
                {previewInfo.organicRemedies && previewInfo.organicRemedies.length > 0 && (
                  <div className="treatment-section-card organic-box">
                    <h4 className="section-subtitle-tag green-tag">
                      <CheckCircle2 size={16} /> {t('organicRemedies')}
                    </h4>
                    <div className="organic-items-grid">
                      {previewInfo.organicRemedies.map((org, i) => (
                        <div key={i} className="organic-item-card">
                          <div className="organic-item-name-row">
                            <span className="organic-item-name">{org.treatment}</span>
                            <span className="organic-dosage-badge">{org.dosage}</span>
                          </div>
                          <div className="organic-method-line">{org.method}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cultural Practices */}
                {previewInfo.culturalPractices && previewInfo.culturalPractices.length > 0 && (
                  <div className="treatment-section-card">
                    <h4 className="section-subtitle-tag">{t('culturalMeasures')}</h4>
                    <ul className="bullet-recommendations-list">
                      {previewInfo.culturalPractices.map((prac, i) => (
                        <li key={i}>{prac}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expert Review Advisory */}
                <div className="expert-advisory-warning">
                  <ShieldAlert size={22} className="warning-shield-icon" />
                  <p className="advisory-warning-text">{t('expertWarning')}</p>
                </div>
              </div>
            );
          })() : (
            <div className="crop-diagnostic-guide-card">
              <div className="guide-header-strip">
                <span className="guide-crop-emoji">{activeGuide.emoji}</span>
                <div>
                  <h3 className="guide-crop-title">
                    {language === 'hi'
                      ? `${activeGuide.hindiName} रोग निदान एवं उपचार निर्देशिका`
                      : `${activeGuide.name} Pathology & Diagnostic Guide`}
                  </h3>
                  <p className="guide-crop-sub">
                    {language === 'hi'
                      ? `फंगल, बैक्टीरियल या वायरल संक्रमण पहचानने या स्वस्थ पत्ते की पुष्टि हेतु बाईं ओर ${activeGuide.hindiName} के पत्ते की फोटो अपलोड करें।`
                      : `Upload a leaf photograph of ${activeGuide.name} on the left to identify fungal, bacterial, viral infections, or confirm healthy foliage.`}
                  </p>
                </div>
              </div>

              <div className="guide-conditions-section">
                <h4 className="guide-section-label">
                  {language === 'hi'
                    ? `समर्थित ${activeGuide.hindiName} रोग वर्ग:`
                    : `Supported ${activeGuide.name} Disease Classes:`}
                </h4>
                <div className="guide-conditions-chips">
                  {activeGuide.conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className="guide-condition-chip clickable-chip"
                      onClick={() => setPreviewCondition(cond)}
                      title={t('viewRemedies')}
                    >
                      <CheckCircle2 size={13} className="chip-icon" />
                      <span>{cond}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={13} style={{ color: '#059669' }} />
                  <span>{t('viewRemedies')}</span>
                </p>
              </div>

              <div className="guide-tips-section">
                <h4 className="guide-section-label">
                  {language === 'hi'
                    ? 'पत्ते की फोटोग्राफी हेतु आवश्यक सुझाव:'
                    : 'Inspection & Photography Guidelines:'}
                </h4>
                <ul className="guide-tips-list">
                  {(language === 'hi' && activeGuide.photoTipsHindi ? activeGuide.photoTipsHindi : activeGuide.photoTips).map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnosis History Section */}
      <div className="disease-history-section">
        <div className="history-header-row">
          <div className="history-titles">
            <h3 className="history-title-text">{t('diagnosisHistory')}</h3>
            <span className="history-sub-text">
              {language === 'hi' ? 'संग्रहीत स्कैन और नैदानिक इतिहास' : 'Archived leaf scans and diagnostic history'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="history-filter-pill-group" style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: historyCropFilter === 'current' ? '#ffffff' : 'transparent',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 650,
                  color: historyCropFilter === 'current' ? '#065f46' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: historyCropFilter === 'current' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
                onClick={() => setHistoryCropFilter('current')}
              >
                {language === 'hi' ? `${activeGuide.hindiName} केवल` : `${activeGuide.name} Only`}
              </button>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: historyCropFilter === 'all' ? '#ffffff' : 'transparent',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 650,
                  color: historyCropFilter === 'all' ? '#065f46' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: historyCropFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
                onClick={() => setHistoryCropFilter('all')}
              >
                {language === 'hi' ? 'सभी फसलें' : 'All Crops'}
              </button>
            </div>

            <button type="button" className="refresh-history-btn" onClick={fetchHistory} disabled={loadingHistory}>
              <RefreshCw size={14} className={loadingHistory ? 'spinning' : ''} />
              <span>{language === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="history-items-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>{language === 'hi' ? 'रिकॉर्ड ID' : 'Record ID'}</th>
                  <th>{language === 'hi' ? 'फोटो फाइल' : 'Image File'}</th>
                  <th>{language === 'hi' ? 'पहचाना गया रोग' : 'Classified Pathology'}</th>
                  <th>{language === 'hi' ? 'सटीकता' : 'Confidence'}</th>
                  <th>{language === 'hi' ? 'समीक्षा स्थिति' : 'Review Status'}</th>
                  <th>{language === 'hi' ? 'दिनांक व समय' : 'Date & Time'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td className="file-col">
                      <span className="file-badge">{item.image_reference || 'leaf.jpg'}</span>
                    </td>
                    <td className="disease-name-col">
                      <strong>{item.predicted_class.replace(/___/g, ' - ').replace(/_/g, ' ')}</strong>
                    </td>
                    <td>
                      <span className="confidence-pill">
                        {(Number(item.confidence) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {item.needs_expert_review ? (
                        <span className="status-pill warning-pill">{t('needsReviewBadge')}</span>
                      ) : (
                        <span className="status-pill success-pill">{t('healthyBadge')}</span>
                      )}
                    </td>
                    <td className="date-col">
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-history-box">
            <Info size={18} />
            <span>
              {historyCropFilter === 'current'
                ? `No previous disease scans recorded for ${activeGuide.name} yet.`
                : t('noHistoryYet')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
