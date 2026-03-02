import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PricingCardProps {
  title: string;
  price: number;
  features: string[];
  highlighted?: boolean;
}

export default function PricingCard({ title, price, features, highlighted = false }: PricingCardProps) {
  return (
    <div
      className={`bg-navy-secondary rounded-xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
        highlighted ? 'border-gold' : 'border-transparent'
      }`}
    >
      {highlighted && (
        <div className="text-gold text-sm font-semibold uppercase tracking-wider mb-4">Most Popular</div>
      )}
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-white">${price}</span>
        <span className="text-gray-muted">/month</span>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <span className="text-gray-muted">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/upload"
        className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
          highlighted
            ? 'bg-gold text-navy-primary hover:bg-gold/90'
            : 'bg-navy-primary text-white hover:bg-navy-primary/80 border border-gray-muted/20'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
