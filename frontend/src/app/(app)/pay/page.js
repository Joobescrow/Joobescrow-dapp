'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CreatePayLinkModal from '../../../components/CreatePayLinkModal';
import { isValidPayCategory, DEFAULT_PAY_CATEGORY } from '../../../config/payLink';

function PayRouteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hasPay = searchParams?.has('pay');
  const catParam = searchParams?.get('category');
  const targetCategory = isValidPayCategory(catParam) ? catParam : DEFAULT_PAY_CATEGORY;

  useEffect(() => {
    if (hasPay) {
      // Forward the user to the niche page while preserving all query params
      const qs = searchParams.toString();
      router.replace(`/${targetCategory}${qs ? `?${qs}` : ''}`);
    }
  }, [hasPay, targetCategory, searchParams, router]);

  // If no 'pay' param is passed, present the generator modal directly or back to /app
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <CreatePayLinkModal
        onClose={() => router.push('/app')}
        defaultCategory={targetCategory}
      />
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center', color: '#9ca8a1' }}>Loading...</div>}>
      <PayRouteContent />
    </Suspense>
  );
}
