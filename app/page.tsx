import Link from 'next/link';

// Placeholder for the Labs hub (step 7).
export default function LabsHome() {
  return (
    <main style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Xplore Labs</h1>
      <p>
        <Link href="/linux">Root Escape</Link>
      </p>
    </main>
  );
}
