import PersonaliseClient from "./PersonaliseClient";

export default async function PersonalisePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const allowDemo =
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development";
  return (
    <PersonaliseClient
      allowDemo={allowDemo}
      hasPaidSession={Boolean(params.session_id)}
    />
  );
}
