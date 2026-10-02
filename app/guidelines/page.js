import LegalPage from '../../components/LegalPage';

export default function GuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines" updated="Draft — not yet reviewed by a lawyer">
      <p>Tubambe exists so creators can build something real. These rules keep it a place people actually want to be.</p>

      <h2>Not allowed, ever</h2>
      <ul>
        <li>Sexual content involving minors, in any form.</li>
        <li>Content that sexualizes, exploits, or endangers anyone under 18.</li>
        <li>Threats, incitement to violence, or content that promotes terrorism or extremism.</li>
        <li>Hate speech targeting people based on race, ethnicity, religion, gender, sexuality, or disability.</li>
        <li>Harassment, bullying, or coordinated pile-ons against another user.</li>
        <li>Non-consensual sexual content, and sharing someone's private info without consent.</li>
        <li>Content that seriously misleads people in ways that could cause real-world harm.</li>
      </ul>

      <h2>Also not allowed</h2>
      <ul>
        <li>Spam, fake engagement, or impersonating someone else.</li>
        <li>Posting content you don't have the rights to.</li>
        <li>Buying, selling, or trading accounts.</li>
      </ul>

      <h2>How enforcement works</h2>
      <p>
        Reported content is reviewed against these guidelines. Depending on severity, outcomes
        range from content removal to permanent account removal. Repeated or severe violations
        lead to faster, stronger action.
      </p>

      <h2>If you see something</h2>
      <p>Use the Report option on any video, comment, or profile. You can also block anyone whose content you don't want to see, whether or not it breaks these rules.</p>
    </LegalPage>
  );
}
