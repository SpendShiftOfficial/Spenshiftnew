import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
alternates: {
canonical: "https://www.spendshift.com.au/",
},
};

export default function Page() {
return <HomePageClient />;
}
