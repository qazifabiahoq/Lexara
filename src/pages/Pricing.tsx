import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';

interface FAQ {
  question: string;
  answer: string;
}

export default function Pricing() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs: FAQ[] = [
    {
      question: 'How accurate is the AI analysis?',
      answer:
        'Lexara uses advanced AI models trained on thousands of contracts. While our AI provides highly accurate first-pass analysis with 95%+ accuracy in clause identification and risk scoring, we always recommend final review by a qualified attorney. Lexara is designed to make lawyers faster, not replace them.',
    },
    {
      question: 'What types of contracts does Lexara support?',
      answer:
        'Lexara supports all standard business contracts including NDAs, employment agreements, service agreements, purchase agreements, lease agreements, and more. Our AI is continuously trained on new contract types to expand coverage.',
    },
    {
      question: 'How secure is my data?',
      answer:
        'We take security seriously. All contracts are encrypted in transit and at rest using industry-standard AES-256 encryption. We are SOC 2 Type II certified and never use your contracts to train our models without explicit permission. Your data is automatically deleted after 90 days unless you choose to save it.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer:
        'Yes, you can cancel your subscription at any time with no penalties. You will continue to have access until the end of your billing period. We also offer a 14-day money-back guarantee if you are not satisfied.',
    },
    {
      question: 'Do you offer custom enterprise plans?',
      answer:
        'Yes, we offer custom enterprise plans with dedicated support, API access, custom integrations, and volume discounts. Contact our sales team to discuss your specific needs.',
    },
    {
      question: 'What format should my contracts be in?',
      answer:
        'Currently, Lexara accepts PDF files only. We recommend uploading clean, text-based PDFs rather than scanned images for best results. Support for Word documents is coming soon.',
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-navy-primary">
      <Navigation />

      <div className="pt-32 pb-20 px-6">
        <motion.div className="max-w-7xl mx-auto" {...fadeInUp}>
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-muted">Choose the plan that fits your team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
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

          <motion.div className="max-w-3xl mx-auto" {...fadeInUp}>
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-navy-secondary rounded-xl overflow-hidden border border-navy-primary hover:border-gold/30 transition-colors"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="text-lg font-semibold text-white">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-gold flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-muted flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-muted leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
