import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Shield, FileCheck, Upload, Zap, FileOutput } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';

export default function Landing() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-navy-primary text-white">
      <Navigation />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Contract Review in{' '}
            <span className="text-gold">30 Seconds</span>
          </motion.h1>
          <motion.p
            className="text-xl text-gray-muted max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Lexara automates first-pass contract analysis so your legal team focuses on what matters
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              to="/upload"
              className="bg-gold hover:bg-gold/90 text-navy-primary px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <a
              href="#how-it-works"
              className="border-2 border-gold text-gold hover:bg-gold hover:text-navy-primary px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              See How It Works
            </a>
          </motion.div>
        </div>
      </section>

      <motion.section className="py-12 px-6 bg-navy-secondary" {...fadeInUp}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-gold mb-2">500+</div>
            <div className="text-gray-muted">Contracts Analyzed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gold mb-2">71%</div>
            <div className="text-gray-muted">Average Risk Detected</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gold mb-2">5 Min</div>
            <div className="text-gray-muted">Saved Per Review</div>
          </div>
        </div>
      </motion.section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-muted">Everything you need for comprehensive contract analysis</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-navy-secondary rounded-xl p-8 hover:border-2 hover:border-gold transition-all duration-300"
              {...fadeInUp}
            >
              <FileText className="w-12 h-12 text-gold mb-4" />
              <h3 className="text-2xl font-bold mb-3">Clause Extraction</h3>
              <p className="text-gray-muted">
                Automatically identifies and categorizes every key clause in your contract with AI precision
              </p>
            </motion.div>

            <motion.div
              className="bg-navy-secondary rounded-xl p-8 hover:border-2 hover:border-gold transition-all duration-300"
              {...fadeInUp}
              transition={{ delay: 0.1 }}
            >
              <Shield className="w-12 h-12 text-gold mb-4" />
              <h3 className="text-2xl font-bold mb-3">Risk Scoring</h3>
              <p className="text-gray-muted">
                Get instant risk assessments for each clause with clear high, medium, and low classifications
              </p>
            </motion.div>

            <motion.div
              className="bg-navy-secondary rounded-xl p-8 hover:border-2 hover:border-gold transition-all duration-300"
              {...fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <FileCheck className="w-12 h-12 text-gold mb-4" />
              <h3 className="text-2xl font-bold mb-3">Redline Memo Generation</h3>
              <p className="text-gray-muted">
                Produces attorney-ready redline memos with recommended changes and legal reasoning
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-6 bg-navy-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-muted">Three simple steps to comprehensive contract analysis</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div className="text-center" {...fadeInUp}>
              <div className="bg-gold/10 border-2 border-gold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Upload Contract</h3>
              <p className="text-gray-muted">
                Simply drag and drop your PDF contract. Lexara supports all standard contract formats
              </p>
            </motion.div>

            <motion.div className="text-center" {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="bg-gold/10 border-2 border-gold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-2xl font-bold mb-3">2. AI Analyzes</h3>
              <p className="text-gray-muted">
                Our AI extracts clauses, scores risks, finds contradictions, and identifies missing protections
              </p>
            </motion.div>

            <motion.div className="text-center" {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="bg-gold/10 border-2 border-gold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <FileOutput className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Get Full Report</h3>
              <p className="text-gray-muted">
                Receive a comprehensive report with risk scoring, redline memo, and actionable recommendations
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-muted">Choose the plan that fits your team</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div {...fadeInUp}>
              <PricingCard
                title="Starter"
                price={49}
                features={['20 contracts per month', '1 user', 'PDF export', 'Email support']}
              />
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <PricingCard
                title="Professional"
                price={149}
                features={['100 contracts per month', '5 users', 'PDF export', 'Priority support']}
                highlighted
              />
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <PricingCard
                title="Enterprise"
                price={499}
                features={[
                  'Unlimited contracts',
                  'Unlimited users',
                  'API access',
                  'Dedicated support',
                ]}
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
