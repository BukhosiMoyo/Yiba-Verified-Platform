export default function StudentOnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-600 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Loading onboarding...</p>
      </div>
    </div>
  );
}
