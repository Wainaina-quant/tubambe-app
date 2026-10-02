import LegalPage from '../../components/LegalPage';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Draft — not yet reviewed by a lawyer">
      <p>
        This is a starting draft for Tubambe's early testing phase. Have a qualified lawyer
        review this against applicable data protection law (e.g. Kenya's Data Protection Act,
        or equivalent laws in your users' countries) before real users rely on it.
      </p>

      <h2>1. What we collect</h2>
      <p>
        Account info you provide (email, display name, handle, birth date, optional bio/country/
        profile photo); content you post (videos, captions, comments); activity (likes, follows,
        reposts, saves, views) needed to make the app work; basic technical data from Supabase
        (our hosting provider) such as sign-in timestamps.
      </p>

      <h2>2. How we use it</h2>
      <p>
        To operate the app (show your feed, notify you of activity, enforce the 16+ age
        requirement), to keep the platform safe (reviewing reports, enforcing blocks), and —
        once monetization launches — to calculate and pay creator earnings.
      </p>

      <h2>3. What other users can see</h2>
      <p>
        Your display name, handle, bio, and public videos are visible to others unless your
        account is set to private, in which case only approved followers can see your videos.
        Likes, comments, and reposts are visible alongside the content they relate to.
      </p>

      <h2>4. Where your data lives</h2>
      <p>
        Data is stored with Supabase (database and file storage). We don't sell your personal
        data to third parties.
      </p>

      <h2>5. Your choices</h2>
      <p>
        You can edit your profile, delete your own videos and comments, block other users, set
        your account to private, and request account deletion by contacting us.
      </p>

      <h2>6. Children</h2>
      <p>Tubambe is not intended for anyone under 16. Accounts found to belong to someone under 16 will be removed.</p>

      <h2>7. Contact</h2>
      <p>Privacy questions or deletion requests: [add a real contact email before launch].</p>
    </LegalPage>
  );
}
