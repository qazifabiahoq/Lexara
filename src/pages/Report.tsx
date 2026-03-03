import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Copy, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import Navigation from '../components/Navigation';

interface Clause {
  id: string;
  title: string;
  text: string;
  risk: 'high' | 'medium' | 'low';
  explanation: string;
}

interface Contradiction {
  severity: 'high' | 'medium';
  description: string;
}

interface MissingProtection {
  risk: 'high' | 'medium';
  title: string;
  explanation: string;
}

interface Report {
  filename: string;
  date: string;
  overallRisk: 'high' | 'medium' | 'low';
  riskPercentage: number;
  chartData: { name: string; value: number; color: string }[];
  executiveSummary: string;
  topDangerousClauses: { title: string; risk: 'high'; explanation: string }[];
  clauses: Clause[];
  contradictions: Contradiction[];
  missingProtections: MissingProtection[];
  redlineMemo: string;
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateReport = location.state?.report as Report | undefined;
  const storedReport = sessionStorage.getItem('lexara_report');
  const report = stateReport ?? (storedReport ? JSON.parse(storedReport) as Report : null);
  const [expandedClause, setExpandedClause] = useState<string | null>(null);
  const [memo, setMemo] = useState(report?.redlineMemo || '');

  if (!report || !report.overallRisk) {
    return (
      <div className="min-h-screen bg-navy-primary">
        <Navigation />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white">No report found</h1>
            <p className="text-gray-muted mt-4">Please upload a contract first</p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-6 bg-gold hover:bg-gold/90 text-navy-primary px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chartData = report.chartData ?? [];
  const topDangerousClauses = report.topDangerousClauses ?? [];
  const clauses = report.clauses ?? [];
  const contradictions = report.contradictions ?? [];
  const missingProtections = report.missingProtections ?? [];

  const getRiskBadgeClass = (risk: 'high' | 'medium' | 'low') => {
    const classes = {
      high: 'bg-risk-high/20 text-risk-high border-risk-high',
      medium: 'bg-risk-medium/20 text-risk-medium border-risk-medium',
      low: 'bg-risk-low/20 text-risk-low border-risk-low',
    };
    return classes[risk];
  };

  const getRiskBorderClass = (risk: 'high' | 'medium' | 'low') => {
    const classes = {
      high: 'border-l-risk-high',
      medium: 'border-l-risk-medium',
      low: 'border-l-risk-low',
    };
    return classes[risk];
  };

  const copyMemo = () => {
    navigator.clipboard.writeText(memo);
    alert('Memo copied to clipboard!');
  };

  const downloadReport = () => {
    alert('Download functionality would be implemented with PDF generation library');
  };

  return (
    <div className="min-h-screen bg-navy-primary">
      <Navigation />

      <div className="sticky top-16 bg-navy-secondary border-b border-navy-primary z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-white">{report.filename}</h2>
              <p className="text-sm text-gray-muted">{report.date}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg border-2 font-semibold uppercase text-sm ${getRiskBadgeClass(
                report.overallRisk
              )}`}
            >
              {report.overallRisk} Risk
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 bg-navy-primary hover:bg-navy-primary/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <button
              onClick={copyMemo}
              className="flex items-center gap-2 bg-gold hover:bg-gold/90 text-navy-primary px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Memo
            </button>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-navy-secondary rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Risk Overview</h3>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-gold mb-2">{report.riskPercentage}%</div>
                <div className="text-gray-muted">Overall Risk Score</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-navy-secondary rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Executive Summary</h3>
              <p className="text-gray-muted leading-relaxed">{report.executiveSummary}</p>
            </div>
          </div>

          <div className="bg-navy-secondary rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-risk-high" />
              Top 3 Most Dangerous Clauses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topDangerousClauses.map((clause, index) => (
                <div
                  key={index}
                  className="bg-navy-primary rounded-lg p-6 border-2 border-risk-high"
                >
                  <span
                    className={`px-3 py-1 rounded-lg border font-semibold text-xs uppercase mb-3 inline-block ${getRiskBadgeClass(
                      clause.risk
                    )}`}
                  >
                    High Risk
                  </span>
                  <h4 className="text-lg font-bold text-white mb-2">{clause.title}</h4>
                  <p className="text-gray-muted text-sm">{clause.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-navy-secondary rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Full Clause Breakdown</h3>
            <div className="space-y-3">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className={`bg-navy-primary rounded-lg overflow-hidden border-l-4 ${getRiskBorderClass(
                    clause.risk
                  )}`}
                >
                  <button
                    onClick={() =>
                      setExpandedClause(expandedClause === clause.id ? null : clause.id)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-navy-primary/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-lg border font-semibold text-xs uppercase ${getRiskBadgeClass(
                          clause.risk
                        )}`}
                      >
                        {clause.risk}
                      </span>
                      <span className="text-white font-medium">{clause.title}</span>
                    </div>
                    {expandedClause === clause.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-muted" />
                    )}
                  </button>
                  {expandedClause === clause.id && (
                    <div className="p-4 border-t border-navy-secondary space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-muted mb-2">
                          Clause Text
                        </h5>
                        <p className="text-white text-sm">{clause.text}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-gray-muted mb-2">
                          Risk Explanation
                        </h5>
                        <p className="text-white text-sm">{clause.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {contradictions.length > 0 && (
            <div className="bg-navy-secondary rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Contradictions Found</h3>
              <div className="space-y-4">
                {contradictions.map((contradiction, index) => (
                  <div
                    key={index}
                    className="bg-navy-primary rounded-lg p-6 border-l-4 border-l-risk-high"
                  >
                    <span
                      className={`px-3 py-1 rounded-lg border font-semibold text-xs uppercase mb-3 inline-block ${getRiskBadgeClass(
                        contradiction.severity
                      )}`}
                    >
                      {contradiction.severity} Severity
                    </span>
                    <p className="text-white">{contradiction.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missingProtections.length > 0 && (
            <div className="bg-navy-secondary rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Missing Protections</h3>
              <div className="space-y-4">
                {missingProtections.map((protection, index) => (
                  <div
                    key={index}
                    className={`bg-navy-primary rounded-lg p-6 border-l-4 ${getRiskBorderClass(
                      protection.risk
                    )}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">{protection.title}</h4>
                      <span
                        className={`px-3 py-1 rounded-lg border font-semibold text-xs uppercase ${getRiskBadgeClass(
                          protection.risk
                        )}`}
                      >
                        {protection.risk} Risk
                      </span>
                    </div>
                    <p className="text-gray-muted">{protection.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-navy-secondary rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Draft Redline Memo</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={copyMemo}
                  className="flex items-center gap-2 bg-navy-primary hover:bg-navy-primary/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 bg-gold hover:bg-gold/90 text-navy-primary px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download as PDF
                </button>
              </div>
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full h-96 bg-navy-primary text-white p-6 rounded-lg border border-gray-muted/20 focus:border-gold focus:outline-none font-mono text-sm leading-relaxed resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
