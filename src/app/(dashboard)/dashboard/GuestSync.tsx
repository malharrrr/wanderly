'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function GuestSync() {
  const router = useRouter();

  useEffect(() => {
    const guestTrip = sessionStorage.getItem('guestTrip');
    
    if (guestTrip) {
      const saveGuestTrip = async () => {
        try {
          const parsed = JSON.parse(guestTrip);
          const res = await fetch('/api/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isSavingGuestTrip: true,
              guestTripData: parsed,
              prompt: parsed.promptUsed || 'Guest Generated Trip'
            })
          });
          
          if (res.ok) {
            sessionStorage.removeItem('guestTrip');
            router.refresh(); 
          }
        } catch (e) {
          console.error('Failed to save guest trip', e);
        }
      };
      
      saveGuestTrip();
    }
  }, [router]);
  return null;
}