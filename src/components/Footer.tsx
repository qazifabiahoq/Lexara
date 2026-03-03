import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-secondary border-t border-navy-primary">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-gold" />
              <span className="text-lg font-bold text-white">Lexara</span>
            </div>
            <p className="text-gray-muted text-sm max-w-xs">
              First-pass contract review in about 2 minutes. Built for legal teams.
            </p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold">Product</h4>
              <a href="#features" className="text-gray-muted hover:text-white transition-colors text-sm">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-muted hover:text-white transition-colors text-sm">
                How It Works
              </a>
              <Link to="/pricing" className="text-gray-muted hover:text-white transition-colors text-sm">
                Pricing
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold">Company</h4>
              <a href="#" className="text-gray-muted hover:text-white transition-colors text-sm">
                About
              </a>
              <a href="#" className="text-gray-muted hover:text-white transition-colors text-sm">
                Contact
              </a>
              <a href="#" className="text-gray-muted hover:text-white transition-colors text-sm">
                Privacy
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-primary">
          <p className="text-gray-muted text-sm text-center">
            &copy; {new Date().getFullYear()} Lexara. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
