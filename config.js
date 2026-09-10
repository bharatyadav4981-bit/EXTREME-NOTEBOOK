// ============================================================
// Your live Supabase project credentials.
// The publishable/anon key is safe to expose in frontend code —
// real security comes from the Row Level Security policies in schema.sql.
// ============================================================

export const SUPABASE_URL = "https://srmczmnanezkefmjhtll.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_yO1E0ZiQvRw10MYojQIvyA_rLoRLgPU";

// ============================================================
// PAYMENT_LINK — where the "Upgrade to premium" button sends people.
//
// This site has no backend server, so it can't hold a secret API key to
// create charges itself — that's exactly why a hosted "Payment Link" is the
// right fit: you generate ONE link from your payment provider's dashboard
// (no code, no server), and every rupee/dollar paid through it is deposited
// straight into the bank account you registered with that provider — this
// app never touches the money at all.
//
// How to get a link (pick one, in an account that's actually yours):
//   • Razorpay (easiest for a solo developer/proprietor in India — supports
//     UPI, cards, netbanking): Dashboard → Payment Pages/Payment Links →
//     Create → copy the https://rzp.io/... URL here.
//   • Cashfree / Instamojo: same idea, dashboard → payment link → copy URL.
//   • Stripe: Dashboard → Payment Links → copy the https://buy.stripe.com/...
//     URL here. (Note: new Stripe India accounts are currently invite-only
//     and generally meant for registered businesses, not solo individuals.)
//
// Paste that link below. Leave it blank until then — the "Upgrade" button
// will just tell the user payments aren't set up yet.
//
// One honest limitation of this simple, no-backend setup: the app can open
// the link and record that someone STARTED a payment, but it can't
// automatically confirm the money actually landed (that needs a small
// server-side webhook, which is a separate, bigger step). Until you add
// that, treat new "pending" rows in the `subscriptions` table as a to-do
// list — check your payment provider's dashboard and flip them to `active`
// yourself once you see the payment come in.
export const PAYMENT_LINK = "";
