import Link from 'next/link';
import { Mic2, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-brand-500/20 p-2 rounded-lg">
                <Mic2 className="w-5 h-5 text-brand-400" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                VoiceScribe
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
