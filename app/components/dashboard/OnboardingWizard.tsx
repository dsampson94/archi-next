'use client';

import { useState, useEffect } from 'react';
import { X, Check, Upload, Settings, Users, Rocket, AlertCircle } from 'lucide-react';

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

interface StepError {
  step: number;
  field?: string;
  message: string;
}

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
  const [stepError, setStepError] = useState<StepError | null>(null);
  const [existingAgentId, setExistingAgentId] = useState<string | null>(null);

  // Check if agent already exists on mount
  useEffect(() => {
    const checkExistingAgent = async () => {
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          if (data.agent) {
            setExistingAgentId(data.agent.id);
            // Pre-fill form with existing agent data
            setBotName(data.agent.name || '');
            setSystemPrompt(data.agent.systemPrompt || systemPrompt);
            setTone(data.agent.tone || 'professional');
            if (data.agent.greeting) {
              setWelcomeMessage(data.agent.greeting);
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing agent:', error);
      }
    };
    
    if (isOpen) {
      checkExistingAgent();
    }
  }, [isOpen]);

  // Clear error when user changes step or modifies input
  const clearError = () => {
    if (stepError) setStepError(null);
  };  if (!isOpen) return null;

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setStepError(null);
    
    try {
      // Step 1: Create or Update agent configuration
      setProcessingStep(existingAgentId ? 'Updating your AI assistant...' : 'Creating your AI assistant...');
      
      const agentPayload = {
        name: botName || 'My AI Assistant',
        systemPrompt,
        tone,
        greeting: welcomeMessage,
      };
      
      const agentResponse = await fetch('/api/agents', {
        method: existingAgentId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPayload),
      });

      if (!agentResponse.ok) {
        const errorData = await agentResponse.json();
        
        // Handle specific error cases
        if (errorData.error?.includes('already exists')) {
          // Agent exists, retry with PUT
          const retryResponse = await fetch('/api/agents', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agentPayload),
          });
          
          if (!retryResponse.ok) {
            const retryError = await retryResponse.json();
            throw new Error(retryError.error || 'Failed to update agent');
          }
        } else if (errorData.error?.includes('name')) {
          setStepError({
            step: 1,
            field: 'botName',
            message: errorData.error || 'Invalid bot name. Please choose a different name.',
          });
          setCurrentStep(1);
          setIsSubmitting(false);
          setProcessingStep('');
          return;
        } else {
          throw new Error(errorData.error || 'Failed to save agent configuration');
        }
      }

      // Step 2: Upload and process documents
      if (uploadedFiles.length > 0) {
        setProcessingStep(`Processing ${uploadedFiles.length} document(s)...`);
        
        // Upload files one by one to get better error messages
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await fetch('/api/documents', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            
            if (errorData.error?.includes('limit')) {
              setStepError({
                step: 2,
                message: errorData.error || 'Document limit reached. Please upgrade your plan.',
              });
              setCurrentStep(2);
              setIsSubmitting(false);
              setProcessingStep('');
              return;
            } else if (errorData.error?.includes('type') || errorData.error?.includes('Unsupported')) {
              setStepError({
                step: 2,
                message: `"${file.name}": ${errorData.error}`,
              });
              setCurrentStep(2);
              setIsSubmitting(false);
              setProcessingStep('');
              return;
            }
            
            throw new Error(`Failed to upload "${file.name}": ${errorData.error}`);
          }
          
          setProcessingStep(`Uploaded ${i + 1}/${uploadedFiles.length} documents...`);
        }
        
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
        
        // Validate phone numbers
        const invalidNumbers = numbers.filter(n => !n.match(/^\+?[1-9]\d{6,14}$/));
        if (invalidNumbers.length > 0) {
          setStepError({
            step: 4,
            field: 'customerNumbers',
            message: `Invalid phone number format: "${invalidNumbers[0]}". Use format: +27821234567`,
          });
          setCurrentStep(4);
          setIsSubmitting(false);
          setProcessingStep('');
          return;
        }
        
        if (numbers.length > 0) {
          setProcessingStep(`Adding ${numbers.length} customer(s)...`);
          
          const customersResponse = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phoneNumbers: numbers,
              sendWelcome: true,
              welcomeMessage,
            }),
          });

          if (!customersResponse.ok) {
            const errorData = await customersResponse.json();
            
            if (errorData.error?.includes('WhatsApp') || errorData.error?.includes('Twilio')) {
              // Non-blocking - WhatsApp not configured, but continue
              console.warn('WhatsApp not configured:', errorData.error);
            } else {
              setStepError({
                step: 4,
                message: errorData.error || 'Failed to add customers. You can add them later from the dashboard.',
              });
              // Don't block completion for customer errors - they can be added later
              console.error('Customer add error:', errorData.error);
            }
          } else {
            const result = await customersResponse.json();
            console.log(`Successfully added ${result.count || numbers.length} customers`);
          }
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
      
      // Show a more helpful error message
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setStepError({
        step: currentStep,
        message: errorMessage,
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Set Up Your AI Assistant</h2>
            <p className="text-xs text-gray-600">
              Step {currentStep} of {STEPS.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-5 py-2 bg-gray-50 border-b flex-shrink-0">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  currentStep > step.id
                    ? 'bg-teal-600 text-white'
                    : currentStep === step.id
                    ? 'bg-teal-100 text-teal-700 border-2 border-teal-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? <Check size={16} /> : step.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    currentStep > step.id ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 min-h-0">
          {/* Global Error Alert */}
          {stepError && stepError.step === currentStep && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{stepError.message}</p>
              </div>
              <button
                onClick={() => setStepError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Step 1: Name Your Bot */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mb-2">
                  <Settings className="text-teal-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{STEPS[0].title}</h3>
                <p className="text-gray-600 mt-2">{STEPS[0].description}</p>
              </div>

              {existingAgentId && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ℹ️ You already have an AI assistant configured. Changes will update your existing bot.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bot Name *
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => {
                    setBotName(e.target.value);
                    clearError();
                  }}
                  placeholder="e.g., Customer Support Bot, Sales Assistant"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm ${
                    stepError?.field === 'botName' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {stepError?.field === 'botName' && (
                  <p className="mt-1 text-xs text-red-600">{stepError.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (shown to customers)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Support Team, John from Sales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 2: Upload Documents */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mb-2">
                  <Upload className="text-teal-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{STEPS[1].title}</h3>
                <p className="text-sm text-gray-600">{STEPS[1].description}</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-700 font-medium text-sm mb-1">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Supports PDF, DOCX, TXT, Markdown, HTML, CSV, JSON (Max 50MB)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.html,.csv,.json"
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

              {/* No files selected - show skip option */}
              {uploadedFiles.length === 0 && (
                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                >
                  Skip for now — I'll add documents later
                </button>
              )}

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">
                    {uploadedFiles.length} file(s) selected:
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                      >
                        <span className="text-xs text-gray-700 truncate">{file.name}</span>
                        <button
                          onClick={() =>
                            setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))
                          }
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Proceed Button - shown after file selection */}
                  <button
                    onClick={handleNext}
                    className="w-full mt-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Check size={18} />
                    Proceed with {uploadedFiles.length} Document{uploadedFiles.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> You can skip this step and add documents later.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Configure Agent */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mb-2">
                  <Settings className="text-teal-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{STEPS[2].title}</h3>
                <p className="text-sm text-gray-600">{STEPS[2].description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tone & Personality
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt (How should your bot behave?) *
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Example: You are a helpful customer support assistant for XYZ company..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-xs text-yellow-800">
                  ⚙️ <strong>Advanced settings</strong> can be configured later in Settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Add Customers */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mb-2">
                  <Users className="text-teal-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{STEPS[3].title}</h3>
                <p className="text-sm text-gray-600">{STEPS[3].description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Welcome Message
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="👋 Hi! I'm here to help..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone Numbers (one per line)
                </label>
                <textarea
                  value={customerNumbers}
                  onChange={(e) => {
                    setCustomerNumbers(e.target.value);
                    clearError();
                  }}
                  rows={4}
                  placeholder="+27821234567&#10;+27821234568"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono text-xs ${
                    stepError?.field === 'customerNumbers' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {stepError?.field === 'customerNumbers' ? (
                  <p className="text-xs text-red-600 mt-1">{stepError.message}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Include country code (e.g., +27 for South Africa). Leave blank to skip.
                  </p>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <Rocket className="mx-auto text-green-600 mb-1" size={24} />
                <h4 className="font-semibold text-green-900 text-sm">Almost Ready!</h4>
                <p className="text-xs text-green-800">
                  Click "Complete Setup" to launch your AI assistant.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            {isSubmitting && processingStep && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="animate-spin h-3 w-3 border-2 border-teal-600 border-t-transparent rounded-full" />
                <span className="hidden sm:inline">{processingStep}</span>
              </div>
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="px-6 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : currentStep === 4 ? (
                <>
                  <Rocket size={16} />
                  Complete Setup
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
