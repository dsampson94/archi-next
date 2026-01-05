'use client';

import { useState } from 'react';
import { X, Check, Upload, Settings, Users, Rocket } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Name Your Bot',
    description: 'Give your AI assistant a name and configure basic settings',
    icon: Settings,
  },
  {
    id: 2,
    title: 'Upload Documents',
    description: 'Add your knowledge base - PDFs, docs, FAQs, product info',
    icon: Upload,
  },
  {
    id: 3,
    title: 'Configure Agent',
    description: 'Set the tone, behavior, and response style',
    icon: Settings,
  },
  {
    id: 4,
    title: 'Add Customers',
    description: 'Import customer phone numbers who will chat with your bot',
    icon: Users,
  },
];

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export default function OnboardingWizard({ isOpen, onClose, tenantId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [botName, setBotName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful AI assistant. Answer questions based on the provided context. Be friendly, professional, and concise.'
  );
  const [tone, setTone] = useState('professional');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [customerNumbers, setCustomerNumbers] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState(
    '👋 Hi! I\'m your AI assistant. I\'m here to help answer your questions. Feel free to ask me anything!'
  );

  if (!isOpen) return null;

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Step 1: Update agent configuration
      setProcessingStep('Creating your AI assistant...');
      const agentResponse = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: botName || 'My AI Assistant',
          systemPrompt,
          tone,
          greetingMessage: welcomeMessage,
        }),
      });

      if (!agentResponse.ok) throw new Error('Failed to create agent');

      // Step 2: Upload and process documents
      if (uploadedFiles.length > 0) {
        setProcessingStep(`Processing ${uploadedFiles.length} document(s)...`);
        const formData = new FormData();
        uploadedFiles.forEach((file) => formData.append('files', file));
        
        const uploadResponse = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload documents');
        
        // Wait a bit for document processing to start
        setProcessingStep('Indexing documents into knowledge base...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Step 3: Add customers and send welcome messages
      if (customerNumbers.trim()) {
        const numbers = customerNumbers
          .split('\n')
          .map((n) => n.trim())
          .filter((n) => n);
        
        if (numbers.length > 0) {
          setProcessingStep(`Sending welcome messages to ${numbers.length} customer(s)...`);
          
          const customersResponse = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phoneNumbers: numbers,
              sendWelcome: true,
              welcomeMessage,
            }),
          });

          if (!customersResponse.ok) throw new Error('Failed to add customers');
          
          const result = await customersResponse.json();
          console.log(`Successfully sent ${result.messagesSent} welcome messages`);
        }
      }

      setProcessingStep('Setup complete! 🎉');
      
      // Wait a moment to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Close wizard and refresh
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Something went wrong. Please try again.');
      setProcessingStep('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return botName.trim().length > 0;
      case 2:
        return true; // Documents are optional
      case 3:
        return systemPrompt.trim().length > 0;
      case 4:
        return true; // Customers are optional
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Set Up Your AI Assistant</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep} of {STEPS.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep > step.id
                    ? 'bg-teal-600 text-white'
                    : currentStep === step.id
                    ? 'bg-teal-100 text-teal-700 border-2 border-teal-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? <Check size={20} /> : step.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Name Your Bot */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                  <Settings className="text-teal-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{STEPS[0].title}</h3>
                <p className="text-gray-600 mt-2">{STEPS[0].description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Name *
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g., Customer Support Bot, Sales Assistant"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name (shown to customers)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Support Team, John from Sales"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Upload Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                  <Upload className="text-teal-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{STEPS[1].title}</h3>
                <p className="text-gray-600 mt-2">{STEPS[1].description}</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-teal-500 transition">
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-700 font-medium mb-2">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports PDF, DOCX, TXT (Max 50MB)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer"
                >
                  Choose Files
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {uploadedFiles.length} file(s) selected:
                  </p>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() =>
                          setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> You can skip this step and add documents later from
                  the Documents page.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Configure Agent */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                  <Settings className="text-teal-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{STEPS[2].title}</h3>
                <p className="text-gray-600 mt-2">{STEPS[2].description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone & Personality
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt (How should your bot behave?) *
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Example: You are a helpful customer support assistant for XYZ company..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚙️ <strong>Advanced settings</strong> (confidence threshold, temperature, etc.)
                  can be configured later in Settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Add Customers */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                  <Users className="text-teal-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{STEPS[3].title}</h3>
                <p className="text-gray-600 mt-2">{STEPS[3].description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message (sent to customers automatically)
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="👋 Hi! I'm here to help..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be sent via WhatsApp when you complete setup
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Phone Numbers (one per line)
                </label>
                <textarea
                  value={customerNumbers}
                  onChange={(e) => setCustomerNumbers(e.target.value)}
                  rows={8}
                  placeholder="+27821234567&#10;+27821234568&#10;+27821234569"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Format: Include country code (e.g., +27 for South Africa)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> You can also bulk import via CSV later from the
                  Customers page.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Rocket className="mx-auto text-green-600 mb-3" size={40} />
                <h4 className="font-bold text-green-900 mb-2">Almost Ready!</h4>
                <p className="text-sm text-green-800">
                  Click "Complete Setup" to launch your AI assistant. Your customers will receive a
                  welcome message and can start chatting immediately!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isSubmitting}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex items-center gap-4">
            {isSubmitting && processingStep && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full" />
                <span>{processingStep}</span>
              </div>
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : currentStep === 4 ? (
                <>
                  <Rocket size={18} />
                  Complete Setup & Send Messages
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
