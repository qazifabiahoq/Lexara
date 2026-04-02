import { Link, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const prefix = isHome ? '' : '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-primary/95 backdrop-blur-sm border-b border-navy-secondary">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Scale className="w-7 h-7 text-gold" />
          <span className="text-xl font-bold text-white">Lexara</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href={`${prefix}#features`} className="text-gray-muted hover:text-white transition-colors">
            Features
          </a>
          <a href={`${prefix}#how-it-works`} className="text-gray-muted hover:text-white transition-colors">
            How It Works
          </a>
          <a href={`${prefix}#pricing`} className="text-gray-muted hover:text-white transition-colors">
            Pricing
          </a>
        </div>

        <Link
          to="/upload"
          className="bg-gold hover:bg-gold/90 text-navy-primary px-6 py-2.5 rounded-lg font-semibold transition-colors"
        >
          Start Free Trial
        </Link>
      </div>
    </nav>
  );
}

