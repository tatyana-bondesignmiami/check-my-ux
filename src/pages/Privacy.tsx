import { LegalPage } from "@/components/LegalPage";

const Privacy = () => (
  <LegalPage title="Privacy Policy" updated="April 29, 2026">
    <section>
      <h2>Overview</h2>
      <p>
        Fix My UX ("we", "our", "us") provides AI-assisted user experience audits of websites and
        application screenshots. This Privacy Policy explains what information we collect, how we
        use it, and the choices you have. By using Fix My UX you agree to the practices described
        here.
      </p>
    </section>

    <section>
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> email address, name (optional), and authentication
          identifiers when you sign up or log in (including via Google).
        </li>
        <li>
          <strong>Audit content:</strong> screenshots, URLs, descriptions and screen-type
          metadata you submit for analysis.
        </li>
        <li>
          <strong>Generated reports:</strong> the audit output produced by our AI models, scored
          and stored against your account.
        </li>
        <li>
          <strong>Billing information:</strong> plan, transaction identifiers, and last 4 of card
          when you purchase a subscription or credits. Card numbers are processed by our payment
          processors and never reach our servers.
        </li>
        <li>
          <strong>Usage data:</strong> device type, browser, page views, feature interactions,
          and diagnostic logs used to improve reliability and performance.
        </li>
      </ul>
    </section>

    <section>
      <h2>How we use your information</h2>
      <ul>
        <li>To run UX audits and return reports to you.</li>
        <li>To maintain your account, credits, and report history.</li>
        <li>To process payments and prevent fraud.</li>
        <li>To improve our product, models, and prompts based on aggregated usage.</li>
        <li>To send transactional emails (receipts, password resets, important updates).</li>
      </ul>
    </section>

    <section>
      <h2>AI processing</h2>
      <p>
        Screenshots and prompts you submit are sent to our AI provider, Google Gemini (via the
        Lovable AI Gateway), to generate the audit. We do not use your audit content to train
        third-party foundation models. Submissions are retained alongside your reports so you can
        revisit them; you can delete a report at any time from the Reports tab.
      </p>
    </section>

    <section>
      <h2>Payments</h2>
      <p>
        Payments are processed by Stripe and/or Paddle. When you check out, billing details are
        collected directly by the processor under their own privacy terms. We receive only the
        information needed to fulfil and reconcile your purchase (transaction id, plan, status,
        country and tax data where required).
      </p>
    </section>

    <section>
      <h2>Sharing</h2>
      <p>We share data only with service providers acting on our behalf, including:</p>
      <ul>
        <li>Hosting and database (Lovable Cloud / Supabase)</li>
        <li>AI inference (Google Gemini via Lovable AI Gateway)</li>
        <li>Payments (Stripe, Paddle)</li>
        <li>Email delivery (transactional)</li>
      </ul>
      <p>We do not sell your personal information.</p>
    </section>

    <section>
      <h2>Data retention</h2>
      <p>
        We retain your account, reports and billing records for as long as your account is
        active. You can delete individual reports at any time, and you can request full account
        deletion by emailing us. Backups are purged within 30 days of deletion.
      </p>
    </section>

    <section>
      <h2>Your rights</h2>
      <p>
        Depending on your jurisdiction (including the EEA, UK and California) you may have the
        right to access, correct, export or delete your personal information, and to object to
        certain processing. To exercise these rights, contact us at the email below.
      </p>
    </section>

    <section>
      <h2>Security</h2>
      <p>
        We use encryption in transit, role-based access, and row-level security on stored data.
        No system is perfectly secure; please use a strong, unique password and keep your account
        credentials private.
      </p>
    </section>

    <section>
      <h2>Children</h2>
      <p>Fix My UX is not directed to children under 16 and we do not knowingly collect their data.</p>
    </section>

    <section>
      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated via
        email or in-product notice. Continued use after the effective date constitutes acceptance.
      </p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        Questions or requests: <a href="mailto:privacy@fixmyux.app">privacy@fixmyux.app</a>.
      </p>
    </section>
  </LegalPage>
);

export default Privacy;
