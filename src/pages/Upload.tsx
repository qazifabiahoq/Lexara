import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import Navigation from '../components/Navigation';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const loadingSteps = [
    'Extracting Clauses',
    'Analyzing Risk',
    'Detecting Contradictions',
    'Generating Report',
  ];

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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 7000);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(stepInterval);
      navigate('/report', { state: { report: response.data } });
    } catch (error) {
      clearInterval(stepInterval);
      console.error('Error analyzing contract:', error);
      setIsLoading(false);
      alert('Failed to analyze contract. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-navy-primary">
      <Navigation />

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-4">Upload Your Contract</h1>
          <p className="text-gray-muted text-center mb-12">
            Upload a PDF contract and get comprehensive analysis in 30 seconds
          </p>

          {!isLoading ? (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-4 border-dashed rounded-xl p-16 text-center transition-all ${
                  isDragging
                    ? 'border-gold bg-gold/5'
                    : 'border-gray-muted/30 hover:border-gold/50'
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <UploadIcon className="w-16 h-16 text-gold mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {file ? file.name : 'Drop your contract here'}
                  </h3>
                  <p className="text-gray-muted mb-4">or click to browse</p>
                  <p className="text-sm text-gray-muted">Supported formats: PDF only</p>
                </label>
              </div>

              {file && (
                <div className="mt-8 flex items-center justify-center gap-4 bg-navy-secondary rounded-xl p-6">
                  <FileText className="w-6 h-6 text-gold" />
                  <span className="text-white font-medium">{file.name}</span>
                  <span className="text-gray-muted">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!file}
                className="mt-8 w-full bg-gold hover:bg-gold/90 text-navy-primary px-8 py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Contract
              </button>
            </>
          ) : (
            <div className="bg-navy-secondary rounded-xl p-12 text-center">
              <Loader2 className="w-16 h-16 text-gold mx-auto mb-6 animate-spin" />
              <h3 className="text-2xl font-bold text-white mb-3">
                Lexara is reviewing your contract
              </h3>
              <p className="text-gray-muted mb-8">This takes about 30 seconds</p>

              <div className="space-y-4">
                {loadingSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      index === currentStep
                        ? 'bg-gold/10 border-2 border-gold'
                        : index < currentStep
                        ? 'bg-navy-primary/50'
                        : 'bg-navy-primary/30'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        index === currentStep
                          ? 'bg-gold text-navy-primary'
                          : index < currentStep
                          ? 'bg-risk-low text-white'
                          : 'bg-gray-muted/20 text-gray-muted'
                      }`}
                    >
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <span
                      className={`font-medium ${
                        index <= currentStep ? 'text-white' : 'text-gray-muted'
                      }`}
                    >
                      {step}
                    </span>
                    {index === currentStep && (
                      <Loader2 className="w-5 h-5 text-gold ml-auto animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
