import Link from 'next/link';

export default function PublicProfileNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center p-10">
        <h1 className="text-3xl font-bold text-foreground mb-3">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This profile doesn&apos;t exist, was removed, or is restricted to invited viewers.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Create Your Profile
        </Link>
      </div>
    </div>
  );
}

