import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CreditCard, FileText, Building, UploadCloud, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck, Lock, X, Clock } from 'lucide-react';
import api from '../api';
import { toast } from 'react-toastify';

const steps = [
  { id: 1, name: 'Profile', icon: User },
  { id: 2, name: 'Primary ID', icon: CreditCard },
  { id: 3, name: 'Address Proof', icon: FileText },
  { id: 4, name: 'Bank Details', icon: Building },
];

const FileUploadBox = ({ label, id, uploadedFiles, isUploading, handleRemoveFile, handleFileUpload }) => {
  const isUploaded = !!uploadedFiles[id];
  const isLoading = isUploading[id];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{label}</label>}
      
      {isLoading ? (
        <div style={{
          border: '1px solid rgba(243,16,253,0.15)', background: 'white',
          borderRadius: 16, height: 140, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div className="w-full h-full bg-gray-100 animate-pulse absolute inset-0"></div>
          <div style={{ relative: 'z-10', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="w-6 h-6 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <span style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 600 }}>Encrypting & Uploading...</span>
          </div>
        </div>
      ) : isUploaded ? (
        <div style={{
          border: '2px solid rgba(243,16,253,0.3)', background: 'white',
          borderRadius: 16, height: 140, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <img src={uploadedFiles[id]} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectCover: 'cover', opacity: 0.8 }} />
          <div style={{ absolute: 'inset-0', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle2 className="text-[#22C55E]" size={28} style={{ marginBottom: 4 }} />
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Uploaded</span>
          </div>
          <button 
            type="button"
            onClick={() => handleRemoveFile(id)}
            style={{
              position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.2)',
              border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label 
          htmlFor={`file-upload-${id}`}
          style={{
            border: '2px dashed rgba(243, 16, 253, 0.2)', background: 'rgba(255,255,255,0.5)',
            borderRadius: 16, height: 140, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--pink)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(243,16,253,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(243, 16, 253, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <input 
            id={`file-upload-${id}`}
            type="file" 
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e, id)} 
          />
          <UploadCloud className="text-gray-400" size={26} style={{ marginBottom: 6 }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--pink)' }}>Click to upload</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--muted)' }}>SVG, PNG, JPG (MAX. 5MB)</p>
          </div>
        </label>
      )}
    </div>
  );
};

const Kyc = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [kycStatus, setKycStatus] = useState(null); // 'none', 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [actualFiles, setActualFiles] = useState({});
  const [isUploading, setIsUploading] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    aadharNumber: '',
    panNumber: ''
  });

  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const res = await api.get('/kyc/status');
        if (res.data) {
          setKycStatus(res.data.status);
          if (res.data.status === 'approved') setCurrentStep(6);
          else if (res.data.status === 'pending') setCurrentStep(5);
        } else {
          setKycStatus('none');
        }
      } catch (err) {
        console.error('Error fetching KYC status:', err);
        setKycStatus('none');
      } finally {
        setLoading(false);
      }
    };
    fetchKycStatus();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setActualFiles(prev => ({ ...prev, [key]: file }));
      setIsUploading(prev => ({ ...prev, [key]: true }));
      
      const previewUrl = URL.createObjectURL(file);
      setTimeout(() => {
        setUploadedFiles(prev => ({ ...prev, [key]: previewUrl }));
        setIsUploading(prev => ({ ...prev, [key]: false }));
      }, 600);
    }
  };

  const handleRemoveFile = (key) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
    setActualFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
  };

  const nextStep = () => {
    if (currentStep === 1 && !actualFiles.profile) {
      return toast.error('Please upload your profile photo first.');
    }
    if (currentStep === 2 && (!formData.aadharNumber || !actualFiles.aadharFront)) {
      return toast.error('Please enter Document Number and upload the front side page.');
    }
    if (currentStep === 3 && !actualFiles.panFront) {
      return toast.error('Please upload your Utility Bill / Bank Statement.');
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.accountName || !formData.bankName || !formData.accountNumber || !formData.ifscCode) {
      return toast.error('Please fill in all required bank details.');
    }

    try {
      setIsSubmitting(true);
      const payload = new FormData();
      Object.keys(formData).forEach(key => payload.append(key, formData[key]));
      Object.keys(actualFiles).forEach(key => payload.append(key, actualFiles[key]));

      const response = await api.post('/kyc/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message || 'KYC submitted successfully!');
      setCurrentStep(5);
      setKycStatus('pending');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ maxWidth: 860, margin: '0 auto', padding: '16px 20px 48px', textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--near-black)', margin: 0 }}>
          KYC <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Verification</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
          Complete your identity verification to unlock full platform access and secure your account.
        </p>
      </div>

      {/* ── Stepper wizard header */}
      {currentStep <= 4 && (
        <div style={{ position: 'relative', padding: '0 40px', marginBottom: 28 }}>
          {/* Progress bar line background */}
          <div style={{ position: 'absolute', top: 16, left: 56, right: 56, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 100, zIndex: 0 }}>
            <div style={{
              height: '100%', background: 'var(--gradient)', borderRadius: 100,
              width: `${((currentStep - 1) / 3) * 100}%`, transition: 'all 0.5s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
            {steps.map(s => {
              const isAct = currentStep === s.id;
              const isComp = currentStep > s.id;
              const Icon = s.icon;

              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isAct || isComp ? 'var(--gradient)' : 'rgba(0,0,0,0.03)',
                    border: isAct ? '2.5px solid var(--pink)' : '1px solid rgba(0,0,0,0.06)',
                    color: isAct || isComp ? 'white' : 'var(--muted)', transition: 'all 0.3s'
                  }}>
                    {isComp ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isAct ? 'var(--pink)' : 'var(--muted)' }}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Translucent Glass Card Form (Image 5 visual style) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(243, 16, 253, 0.15)', borderRadius: 24,
        padding: 30, boxShadow: '0 8px 32px rgba(243, 16, 253, 0.05)',
        position: 'relative', minHeight: 340
      }}>
        
        {/* Step 1: Profile */}
        {currentStep === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30, alignItems: 'center' }}>
            <div>
              <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                <ShieldCheck size={12} />
                KYC Mandatory Requirement
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--near-black)', margin: '0 0 8px' }}>Profile Verification</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
                Your profile photo is used to securely verify your identity. This is required to process withdrawals and ensure platform integrity.
              </p>
              <div style={{
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#15803d'
              }}>
                <Lock size={16} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>SSL Secured</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(21,128,61,0.7)' }}>Encrypted 256-bit Connection</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {isUploading.profile ? (
                <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'white', border: '1.5px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="w-6 h-6 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : uploadedFiles.profile ? (
                <div style={{ width: 160, height: 160, borderRadius: '50%', position: 'relative', overflow: 'hidden', border: '3px solid var(--pink)', boxShadow: '0 4px 15px rgba(243,16,253,0.15)' }}>
                  <img src={uploadedFiles.profile} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('profile')}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="profile-upload"
                  style={{
                    width: 160, height: 160, borderRadius: '50%', border: '2px dashed rgba(243, 16, 253, 0.2)',
                    background: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--pink)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(243, 16, 253, 0.2)'}
                >
                  <input type="file" id="profile-upload" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'profile')} />
                  <UploadCloud size={28} className="text-gray-400" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)', marginTop: 6 }}>Select Photo</span>
                  <span style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>Click to browse</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Primary ID */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--near-black)', margin: 0 }}>Primary Photo ID</h2>
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                <Lock size={9} /> Secured
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>
              Upload a valid government-issued photo ID (Passport, National ID, or Driver's License).
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                ID Document / Passport / License Number
              </label>
              <input 
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                placeholder="Enter your document number"
                style={{
                  background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
                  padding: '12px 16px', fontSize: 13, color: 'var(--near-black)', width: '100%'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <FileUploadBox label="Front Side (ID / License) or Passport Photo Page" id="aadharFront" uploadedFiles={uploadedFiles} isUploading={isUploading} handleRemoveFile={handleRemoveFile} handleFileUpload={handleFileUpload} />
              <FileUploadBox label="Back Side of Document (if applicable)" id="aadharBack" uploadedFiles={uploadedFiles} isUploading={isUploading} handleRemoveFile={handleRemoveFile} handleFileUpload={handleFileUpload} />
            </div>
          </div>
        )}

        {/* Step 3: Address Proof */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--near-black)', margin: 0 }}>Proof of Address</h2>
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                <Lock size={9} /> Secured
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>
              Upload a document showing your current address (Utility Bill or Bank Statement, issued within the last 3 months).
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Document Reference Number (Optional)
              </label>
              <input 
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                placeholder="e.g. Account Number, Invoice Number, Ref No"
                style={{
                  background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
                  padding: '12px 16px', fontSize: 13, color: 'var(--near-black)', width: '100%', textTransform: 'uppercase'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <FileUploadBox label="Utility Bill / Bank Statement Page 1" id="panFront" uploadedFiles={uploadedFiles} isUploading={isUploading} handleRemoveFile={handleRemoveFile} handleFileUpload={handleFileUpload} />
              <FileUploadBox label="Bill / Statement Additional Page (if any) or Selfie with ID" id="panAgreement" uploadedFiles={uploadedFiles} isUploading={isUploading} handleRemoveFile={handleRemoveFile} handleFileUpload={handleFileUpload} />
            </div>
          </div>
        )}

        {/* Step 4: Bank Details */}
        {currentStep === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--near-black)', margin: 0 }}>Bank Account Details</h2>
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                <Lock size={9} /> Secured
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>
              Provide bank details for your future withdrawals.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Account Holder Name</label>
                <input type="text" name="accountName" value={formData.accountName} onChange={handleInputChange} placeholder="Name as per Bank" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--near-black)', width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Bank Name</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g. State Bank of India" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--near-black)', width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Account Number</label>
                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} placeholder="Enter Account Number" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--near-black)', width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>IFSC Code</label>
                <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} placeholder="SBIN0001234" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--near-black)', width: '100%', textTransform: 'uppercase' }} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Branch Name</label>
              <input type="text" name="branchName" value={formData.branchName} onChange={handleInputChange} placeholder="Enter Branch Name" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--near-black)', width: '100%' }} />
            </div>
          </div>
        )}

        {/* Step 5: Verification Pending */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px 0', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
              boxShadow: '0 4px 15px rgba(245,158,11,0.1)'
            }}>
              <Clock size={36} style={{ color: 'var(--amber)' }} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--near-black)', margin: '0 0 6px' }}>Verification Pending</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px', maxWidth: 440, lineHeight: 1.6 }}>
              Your KYC details are currently under review by our compliance team. This usually takes 24-48 hours. We will notify you once verified.
            </p>
            <button
              onClick={() => { setKycStatus('none'); setCurrentStep(1); }}
              style={{ background: 'none', border: 'none', color: 'var(--pink)', fontWeight: 700, fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Need to update details? Click here to re-upload.
            </button>
          </div>
        )}

        {/* Step 6: Verified State */}
        {currentStep === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px 0', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
              boxShadow: '0 4px 15px rgba(34,197,94,0.1)'
            }}>
              <ShieldCheck size={36} style={{ color: 'var(--green)' }} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--near-black)', margin: '0 0 4px' }}>Account Verified</h3>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', tracking: '0.1em', margin: '0 0 14px' }}>
              Level 1 Verified
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px', maxWidth: 440, lineHeight: 1.6 }}>
              Congratulations! Your identity has been successfully verified. You now have full access to all platform features, including withdrawals.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%', maxWidth: 360 }}>
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', padding: '12px 14px', borderRadius: 16 }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Status</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>Active</p>
              </div>
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', padding: '12px 14px', borderRadius: 16 }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Withdrawal Limit</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--near-black)' }}>Unlimited</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer Navigation Actions (Only for Step 1-4) */}
        {currentStep <= 4 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.06)'
          }}>
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none',
                    border: 'none', color: 'var(--muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={currentStep === 4 ? handleSubmit : nextStep}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                background: currentStep === 4 ? 'linear-gradient(135deg, #00FF99, #00C6FF)' : 'var(--gradient)',
                boxShadow: currentStep === 4 ? '0 4px 15px rgba(0,255,153,0.2)' : '0 4px 15px rgba(243,16,253,0.2)'
              }}
            >
              {isSubmitting ? 'Submitting...' : currentStep === 4 ? 'Submit Verification' : 'Next Step'}
              {currentStep < 4 && <ChevronRight size={16} />}
              {currentStep === 4 && !isSubmitting && <CheckCircle2 size={16} />}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Kyc;
