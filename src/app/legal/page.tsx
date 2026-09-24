import { Metadata } from "next";
import Link from "next/link";
import { Scale, FileText, CheckCircle2, AlertCircle, ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Terms & Conditions | VoiceScribe",
  description: "Review VoiceScribe terms of service, subscription policies, acceptable use, and legal disclosures.",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
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
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              Terms of Service & Legal Notices
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
              Effective Date: September 24, 2026
            </p>
          </div>
        </div>
      </div>

      {/* Intro Banner */}
      <div className="card-border rounded-3xl p-6 sm:p-8 mb-10 border-orange-500/30 bg-black/5 dark:bg-white/5">
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
          By accessing or using VoiceScribe (via web, browser extension, or native desktop app), you agree to be bound by these Terms of Service. Please read them carefully.
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              1. Acceptance & Service Description
            </h2>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            VoiceScribe provides automated AI-assisted transcription services for audio and video files. We grant you a non-exclusive, non-transferable, revocable license to access and use the service in accordance with these Terms.
          </p>
        </section>

        {/* Section 2 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              2. Free Plan & Pro Subscriptions
            </h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300 pl-2">
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Free Tier:</strong> Includes up to 2 free transcriptions per user account.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Pro Subscription:</strong> Unlocks unlimited transcriptions at ₦2,000/month (or equivalent rate). Subscriptions renew automatically unless cancelled prior to the billing cycle.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-gray-100">Refund Policy:</strong> Due to the digital and consumable nature of AI processing resources, subscription fees are non-refundable once activated, except as required by applicable law.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              3. User Conduct & Content Ownership
            </h2>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            You retain all intellectual property rights to the audio files uploaded and the resulting transcriptions generated. You warrant that you have all necessary rights and consent to upload and process the media content. You agree not to use VoiceScribe for illegal, deceptive, or infringing purposes.
          </p>
        </section>

        {/* Section 4 */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              4. Disclaimer of Warranties & Limitation of Liability
            </h2>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            VoiceScribe is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While we strive for maximum accuracy, automated AI transcription may contain inaccuracies. VoiceScribe shall not be liable for any indirect, incidental, or consequential damages resulting from service usage or transcription inaccuracies.
          </p>
        </section>
      </div>
    </div>
  );
}
