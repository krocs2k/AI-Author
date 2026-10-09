import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Offline — AI Author',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 rounded-2xl border border-teal-400/20 bg-gray-800/60 p-5 shadow-gold">
        <BookOpen className="h-10 w-10 text-teal-400" />
      </div>
      <h1 className="font-display text-3xl font-semibold text-gold-gradient">You&apos;re offline</h1>
      <p className="mt-3 max-w-md font-serif text-gray-300">
        AI Author needs a connection to craft your next chapter. Please reconnect and your
        writing studio will be right where you left it.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-teal-400 px-6 py-2.5 text-sm font-semibold text-gray-950 shadow-gold transition-colors hover:bg-teal-300"
      >
        Try again
      </Link>
    </div>
  );
}
