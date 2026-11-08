import PersonaliseClient from "./PersonaliseClient";

export default function PersonalisePage() {
  // Vercel preview is allowed to use sample customers without charging.
  // Production must require a verified paid Stripe session.
  const allowDemo =
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development";
  return <PersonaliseClient allowDemo={allowDemo} />;
}
