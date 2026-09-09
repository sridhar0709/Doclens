
export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-navy sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-blue-400">Last updated: July 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-blue sm:text-base">
            <section>
              <h2 className="font-display text-xl font-semibold text-ink-navy">What this covers</h2>
              <p className="mt-2">
                This policy explains how DocLens handles your personal information when you use our service. 
                DocLens is an open-source project — not a company. We do not sell your data, show you ads, 
                or share your information with third parties.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-navy">What we collect</h2>
              <p className="mt-2">To check your scheme eligibility, we need:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Your name and email address (for your account)</li>
                <li>Date of birth, gender, and social category (for eligibility rules)</li>
                <li>State and district of residence (for location-specific schemes)</li>
                <li>Annual household income and occupation (for means-tested schemes)</li>
                <li>Disability status (if applicable, for disability-linked schemes)</li>
                <li>Uploaded documents (Aadhaar, income certificate, caste certificate, ration card, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-navy">How we use it</h2>
              <p className="mt-2">
                Your profile data is used exclusively to determine your eligibility for welfare schemes. 
                The deterministic rule engine compares your data against published scheme criteria — 
                no AI or machine learning is involved in eligibility decisions.
              </p>
              <p className="mt-2">
                Uploaded documents are processed for OCR text extraction so we can pre-fill application drafts. 
                You must explicitly confirm the extracted information before it is saved to your profile.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-navy">Data storage & security</h2>
              <p className="mt-2">
                Your data is stored in a PostgreSQL database hosted on Supabase, with encryption at rest and in transit. 
                We use row-level security to ensure your data is only accessible to you.
              </p>
              <p className="mt-2">
                We retain your profile data for as long as your account is active. You may delete your account and 
                all associated data at any time from your settings page.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-navy">What we do NOT do</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>We do not sell or rent your personal data</li>
                <li>We do not show advertisements</li>
                <li>We do not share your data with any government agency</li>
                <li>We do not use your data for any purpose beyond eligibility matching</li>
                <li>We do not log your profile data in server logs</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-navy">Third-party services</h2>
              <p className="mt-2">
                We use Supabase for authentication and database hosting. We use Google Gemini for one narrow task: 
                polishing the language of benefit summaries and application drafts. The eligibility engine itself 
                is fully deterministic and does not use any external AI service.
              </p>
              <p className="mt-2">
                No government agency has access to your data through our systems. We are an independent project 
                with no government affiliation.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-navy">Contact</h2>
              <p className="mt-2">
                Since DocLens is a volunteer-run open-source project, we do not have a dedicated privacy 
                email address. For privacy-related questions, please open an issue or discussion on our{" "}
                <a href="https://github.com/sridhar0709/Document-analysis" target="_blank" rel="noopener noreferrer" className="text-signal-orange underline underline-offset-2">
                  GitHub repository
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
