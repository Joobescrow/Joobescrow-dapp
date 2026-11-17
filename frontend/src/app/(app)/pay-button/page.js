'use client';

import { useRouter } from 'next/navigation';
import PayButtonBuilder from '../../../components/PayButtonBuilder';

export default function PayButtonPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <PayButtonBuilder onClose={() => router.push('/app')} />
    </div>
  );
}
