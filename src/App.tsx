import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import ResumeBuilder from "./components/ResumeBuilder";
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { ATSChecker } from './components/ATSChecker';
import { PaymentPage } from './components/PaymentPage';


type Section = 'dashboard' | 'resume' | 'cover-letter' | 'ats-checker' | 'upgrade' | 'admin';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleNavigate = (section: Section) => {
    setCurrentSection(section);
  };

  const handleBack = () => {
    setCurrentSection('dashboard');
  };

  switch (currentSection) {
    case 'resume':
      return <ResumeBuilder onBack={handleBack} />;
    case 'cover-letter':
      return <CoverLetterGenerator onBack={handleBack} />;
    case 'ats-checker':
      return <ATSChecker onBack={handleBack} />;
    case 'upgrade':
      return <PaymentPage onBack={handleBack} />;
    default:
      return <Dashboard onNavigate={handleNavigate} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AuthProvider>
  );
}