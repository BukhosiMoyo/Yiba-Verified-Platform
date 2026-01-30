import { QctoPublicProfilesClient } from "./QctoPublicProfilesClient";

export const metadata = {
  title: "Public profiles | QCTO",
  description: "Verify institution public profiles and posts.",
};

export default function QctoPublicProfilesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground">Public profiles</h1>
      <p className="mt-1 text-muted-foreground">
        Verify institution public profiles and posts listed on the public directory.
      </p>
      <QctoPublicProfilesClient />
    </div>
  );
}
