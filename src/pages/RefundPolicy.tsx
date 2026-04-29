import { LegalPage } from "@/components/LegalPage";

const RefundPolicy = () => (
  <LegalPage title="Refund Policy" updated="April 29, 2026">
    <section>
      <h2>Our promise</h2>
      <p>
        We want you to be happy with Fix My UX. If the Service didn't work as expected, we'll do
        our best to make it right. This policy explains when refunds are available and how to
        request one.
      </p>
    </section>

    <section>
      <h2>Subscriptions</h2>
      <ul>
        <li>
          <strong>14-day money-back guarantee.</strong> New subscribers can request a full refund
          within 14 days of their first paid charge, provided fewer than 25 audits have been
          consumed during that period.
        </li>
        <li>
          <strong>Renewals.</strong> Renewal charges are non-refundable once processed. You can
          cancel at any time from your Account page to prevent the next renewal.
        </li>
        <li>
          <strong>Annual plans.</strong> If you cancel an annual plan within 14 days of purchase
          (and have used fewer than 50 audits), we will refund the full amount. After that
          window, annual plans are non-refundable but remain active until the end of the term.
        </li>
      </ul>
    </section>

    <section>
      <h2>Credit packs and one-time purchases</h2>
      <p>
        Credit packs are refundable within 14 days of purchase if no credits have been consumed.
        Once any credit from a pack has been used, the purchase becomes non-refundable.
      </p>
    </section>

    <section>
      <h2>Service issues</h2>
      <p>
        If a billed audit fails due to a verifiable bug or outage on our side, we will restore
        the credit automatically or refund it on request. Failed audits caused by unsupported
        input (e.g., blank screenshots, blocked URLs, unsupported file types) are not eligible
        for refunds but credits are typically restored automatically.
      </p>
    </section>

    <section>
      <h2>Chargebacks</h2>
      <p>
        Please contact us before initiating a chargeback — we can almost always resolve issues
        faster directly. Accounts with unresolved chargebacks may be suspended pending review.
      </p>
    </section>

    <section>
      <h2>How refunds are processed</h2>
      <p>
        Refunds are issued to the original payment method via Stripe or Paddle, depending on how
        you paid. Processing typically takes 5–10 business days to appear on your statement.
        Currency conversion or processor fees imposed by your bank are outside our control.
      </p>
    </section>

    <section>
      <h2>How to request a refund</h2>
      <p>
        Email <a href="mailto:billing@fixmyux.app">billing@fixmyux.app</a> from the address on
        your account with:
      </p>
      <ul>
        <li>The transaction date and amount, or your invoice number.</li>
        <li>A short note about why you're requesting a refund.</li>
      </ul>
      <p>We aim to respond within 2 business days.</p>
    </section>

    <section>
      <h2>Statutory rights</h2>
      <p>
        This policy is in addition to, and does not limit, any rights you may have under
        applicable consumer protection laws (including EU/UK distance-selling regulations).
      </p>
    </section>
  </LegalPage>
);

export default RefundPolicy;
