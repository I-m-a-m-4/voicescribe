import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, HardDrive, EyeOff, Server, FileCheck, ArrowLeft, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | VoiceScribe",
  description: "Learn how VoiceScribe protects your audio files, transcriptions, and personal data with privacy-first client-side processing.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:text-orange-500 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-500">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
              Last updated: September 24, 2026
            </p>
          </div>
        </div>
      </div>

      {/* Main Privacy Commitment Banner */}
      <div className="card-border rounded-3xl p-6 sm:p-8 mb-10 border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-orange-500 text-white shrink-0 shadow-lg shadow-orange-500/30">
            <EyeOff className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-1">
              Your Audio Never Leaves Your Control Unnecessarily
            </h2>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
              VoiceScribe is designed with a strict privacy-first architecture. We do not permanently store or train public AI models on your raw audio files or sensitive transcription documents.
            </p>
          </div>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="space-y-8">
        {/* Section 1 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-orange-500" />
            <h3 className="text-xl font-bold text-gray-950 dark:text-white">
              1. Information We Collect
            </h3>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
            We collect minimal personal data necessary to provide our service:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300 pl-2">
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Account Information:</strong> Your email address and display name provided via Google Authentication or email sign-in.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Usage Data:</strong> Number of transcriptions generated to enforce free tier limits and process Pro subscription access.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Saved Transcripts:</strong> Transcripts you explicitly save to your personal dashboard are encrypted and stored in your private Firestore account context.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-orange-500" />
            <h3 className="text-xl font-bold text-gray-950 dark:text-white">
              2. How Audio Files Are Handled
            </h3>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
            VoiceScribe utilizes local client-side media processing via WebAssembly / FFmpeg directly inside your web browser or native desktop application:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" /> Client-Side Conversion
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Audio extraction and compression occur locally in your browser to minimize data transfer.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                <Server className="w-4 h-4 text-orange-500" /> Ephemeral Processing
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Temporary audio segments sent for speech recognition are processed ephemerally and discarded immediately after transcription.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <h3 className="text-xl font-bold text-gray-950 dark:text-white">
              3. Payment Security & Third Parties
            </h3>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            Payments are processed securely via <strong>Paystack</strong>. VoiceScribe never receives or stores your full credit card details, PINs, or banking passwords. Payment authentication and compliance are handled end-to-end by Paystack's PCI-DSS compliant infrastructure.
          </p>
        </section>

        {/* Section 4 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-orange-500" />
            <h3 className="text-xl font-bold text-gray-950 dark:text-white">
              4. Data Deletion & Contact
            </h3>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            You retain complete ownership over your data. You may delete any saved transcriptions directly from your dashboard at any time. To request full account deletion, please contact our support team.
          </p>
        </section>
      </div>
    </div>
  );
}
