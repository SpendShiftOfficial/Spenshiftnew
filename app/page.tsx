import type { Metadata } from "next";
import HomePageClient from "./homePageClient";

export const metadata: Metadata = {
alternates: {
canonical: "https://www.spendshift.com.au/",
},
};

export default function Page() {
return <HomePageClient />;
}
