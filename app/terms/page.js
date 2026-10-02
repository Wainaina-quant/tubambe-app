import LegalPage from '../../components/LegalPage';

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="Draft — not yet reviewed by a lawyer">
      <p>
        These Terms are a starting draft written for Tubambe's early testing phase. Have a
        qualified lawyer review and localize this before real users rely on it — this is not
        legal advice.
      </p>

      <h2>1. Who can use Tubambe</h2>
      <p>
        You must be at least 16 years old to create an account. By signing up, you confirm the
        birth date you provide is accurate.
      </p>

      <h2>2. Your content</h2>
      <p>
        You keep ownership of videos and comments you post. By posting, you give Tubambe a
        license to host, display, and distribute that content within the app so other users can
        view it. You're responsible for having the rights to anything you upload.
      </p>

      <h2>3. What's not allowed</h2>
      <p>
        No content that is illegal, sexually exploits anyone, incites violence, harasses or
        threatens others, or infringes someone else's rights. See the Community Guidelines for
        specifics. Violating this may lead to content removal or account suspension.
      </p>

      <h2>4. Reporting and enforcement</h2>
      <p>
        You can report content or accounts you believe break these rules. We review reports and
        may remove content, suspend, or permanently remove accounts that violate these Terms.
      </p>

      <h2>5. Monetization</h2>
      <p>
        Tubambe intends to share advertising and other revenue with creators. Payout mechanics,
        eligibility, and amounts are not yet finalized and will be described separately once
        payouts launch.
      </p>

      <h2>6. Account termination</h2>
      <p>
        You can delete your own videos and comments at any time. You may stop using Tubambe at
        any time; we may suspend or terminate accounts that violate these Terms.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        Tubambe is provided during an early testing period "as is," without warranties of any
        kind. Features, availability, and these Terms may change as the product develops.
      </p>

      <h2>8. Contact</h2>
      <p>Questions about these Terms: [add a real contact email before launch].</p>
    </LegalPage>
  );
}
