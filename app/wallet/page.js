'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';

const SOURCE_LABEL = {
  ad_revenue: 'Ad revenue',
  tip: 'Tips',
  brand_deal: 'Brand deals',
  shop_sale: 'Shop sales',
};
const SOURCE_COLOR = {
  ad_revenue: 'bg-amber',
  tip: 'bg-teal',
  brand_deal: 'bg-coral',
  shop_sale: 'bg-muted',
};

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [totals, setTotals] = useState({});
  const [currency, setCurrency] = useState('KES');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      const userId = user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('creator_id', userId);

      if (error) console.error(error);

      const grouped = {};
      (data || []).forEach((t) => {
        grouped[t.source] = (grouped[t.source] || 0) + Number(t.amount_local);
        if (t.currency) setCurrency(t.currency);
      });
      setTotals(grouped);
      setLoading(false);
    }
    load();
  }, [authLoading, user]);

  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...Object.values(totals));

  if (!authLoading && !user) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Sign in to view your ad revenue</p>
        <a href="/login" className="text-teal font-semibold text-sm">
          Go to sign in →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6">
      <a href="/profile" className="text-[11.5px] text-muted font-semibold mb-3 inline-block">
        ← Profile
      </a>
      <h1 className="font-display font-extrabold text-xl mb-5">Ad revenue</h1>

      <div className="bg-gradient-to-br from-surface-2 to-surface border border-amber/25 rounded-2xl p-4 mb-5">
        <p className="text-[11.5px] font-bold text-muted">This month</p>
        <p className="font-display font-extrabold text-3xl text-coral my-1">
          {currency} {total.toLocaleString()}
        </p>
        <p className="text-[11px] text-muted">Paid directly in local currency — no conversion fees.</p>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : total === 0 ? (
        <p className="text-muted text-sm">
          No earnings recorded yet. Rows in the <code>wallet_transactions</code> table will show up
          here automatically.
        </p>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {Object.entries(totals).map(([source, amount]) => (
            <div key={source}>
              <div className="flex justify-between text-[12.5px] mb-1">
                <span>{SOURCE_LABEL[source] || source}</span>
                <span>
                  {currency} {amount.toLocaleString()}
                </span>
              </div>
              <div className="h-[7px] rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${SOURCE_COLOR[source] || 'bg-muted'}`}
                  style={{ width: `${(amount / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted text-center">
        Payout integration (M-Pesa / MTN MoMo / bank) plugs in here via Flutterwave or Paystack.
      </p>
    </div>
  );
}
