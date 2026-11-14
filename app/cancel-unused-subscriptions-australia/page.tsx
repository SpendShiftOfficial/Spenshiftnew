import type { Metadata } from "next";
import EditorialGuide, { type EditorialGuideData } from "@/components/EditorialGuide";

export const metadata: Metadata = {
  title: "How to Find and Cancel Unused Subscriptions in Australia",
  description: "Find forgotten subscriptions on bank statements, Apple and Google Play. Follow safe cancellation steps and check what you really save.",
  alternates: { canonical: "https://www.spendshift.com.au/cancel-unused-subscriptions-australia" },
  openGraph: { title: "How to Find and Cancel Unused Subscriptions in Australia | SpendShift", description: "Find forgotten subscriptions on bank statements, Apple and Google Play. Follow safe cancellation steps and check what you really save.", url: "https://www.spendshift.com.au/cancel-unused-subscriptions-australia", siteName: "SpendShift", type: "article", locale: "en_AU", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
};

const guide: EditorialGuideData = {
  "label": "AUSTRALIAN SUBSCRIPTIONS GUIDE",
  "title": "How to find and cancel unused subscriptions in Australia",
  "intro": "Streaming, apps, gym plans and free trials can renew without much notice. You don't need a new app or a bank connection to review them. Here is a simple way to find the charges and decide what to keep.",
  "answer": "Check your bank and card transactions for regular payments, then review your Apple or Google subscriptions and email receipts. For each charge, decide whether you still use it. If you cancel, follow the provider's steps and keep proof. Check later that the payment has stopped.",
  "quickChecks": [
    "Scan at least three months of bank and card transactions.",
    "Check yearly renewals and old trial emails too.",
    "Review Apple, Google Play and direct provider subscriptions.",
    "Keep your cancellation confirmation and check your next statement."
  ],
  "reviewed": "14 November 2026",
  "sections": [
    {
      "id": "statements",
      "heading": "1. Find the recurring charges",
      "paragraphs": [
        "Open the statements for the accounts and cards you use. Look for the same business or amount showing up each week, month or year. Some charges have short or unfamiliar names.",
        "Three months can help you find monthly plans. Check the last 12 months as well if you want to catch annual memberships. Write down the name, price, next payment date and whether you still use each service."
      ],
      "steps": [
        {
          "title": "Search your bank or card transactions",
          "text": "Try words such as subscription, membership, streaming and the names of services you use. Review regular payments, not just the search results."
        },
        {
          "title": "Check every payment method",
          "text": "Some plans may be on a different card, PayPal account or a family member's account."
        },
        {
          "title": "Check receipts",
          "text": "Search your email for renewal, subscription, receipt and free trial. A receipt can reveal who actually bills you."
        }
      ],
      "sources": [
        {
          "label": "Moneysmart: Track your spending",
          "url": "https://moneysmart.gov.au/budgeting/track-your-spending",
          "note": "How to check statements and find regular costs."
        },
        {
          "label": "Moneysmart: Get more value from your money",
          "url": "https://moneysmart.gov.au/budgeting/get-more-value-from-your-money",
          "note": "Tips on subscriptions, renewals and recurring bills."
        }
      ]
    },
    {
      "id": "apple",
      "heading": "2. Check subscriptions on an iPhone or iPad",
      "paragraphs": [
        "For subscriptions billed through Apple, open Settings, tap your name, then tap Subscriptions. Choose an active subscription to check its renewal details and any cancellation option.",
        "If the charge isn't there, it may use a different Apple Account or be billed directly by a company. Check the receipt and bank statement to find the real billing provider."
      ],
      "steps": [
        {
          "title": "Open Settings → your name → Subscriptions",
          "text": "Review the active list. Check family memberships and accounts you may have used in the past."
        },
        {
          "title": "Read the renewal date",
          "text": "If you decide to cancel, follow Apple's cancellation steps. Keep the confirmation."
        }
      ],
      "sources": [
        {
          "label": "Apple Support Australia: Cancel a subscription",
          "url": "https://support.apple.com/en-au/118428",
          "note": "Official cancellation steps for subscriptions billed through Apple."
        }
      ]
    },
    {
      "id": "google",
      "heading": "3. Check subscriptions through Google Play",
      "paragraphs": [
        "On Android, open Google Play and review subscriptions for the Google Account you used to buy the service. If you have more than one Google Account, check each one.",
        "Deleting an app does not cancel a Google Play subscription. Open the subscription entry and follow the actual cancellation process. If it was billed by the provider, use that provider's website instead."
      ],
      "sources": [
        {
          "label": "Google Play Help: Cancel a subscription",
          "url": "https://support.google.com/googleplay/answer/7018481?co=GENIE.Platform%3DAndroidAnd&hl=en",
          "note": "Official guidance for subscriptions billed through Google Play."
        }
      ]
    },
    {
      "id": "other",
      "heading": "4. Look for plans outside app stores",
      "paragraphs": [
        "Gym memberships, TV services, software, cloud storage and online services may bill you directly. Check the account settings on the provider's website or contact its support team.",
        "Check whether the membership has a minimum term, a notice period or a cancellation charge. A direct debit can be different from a card subscription. Don't assume removing a payment method ends the underlying agreement."
      ],
      "bullets": [
        "Look at the next renewal date before you cancel.",
        "Check whether cancelling also removes a useful service or shared household access.",
        "Read the cancellation steps and any notice period in the agreement.",
        "If charges seem misleading or won't stop, keep records and seek consumer help."
      ],
      "sources": [
        {
          "label": "ACCC: Subscription traps",
          "url": "https://www.accc.gov.au/media-release/accc-warns-consumers-to-beware-of-subscription-traps",
          "note": "Information on automatic renewals and unclear subscription terms."
        }
      ]
    },
    {
      "id": "decide",
      "heading": "5. Keep what you use; cancel what you do not",
      "paragraphs": [
        "A subscription isn't wasted money if you use it and find it valuable. Start with things you forgot about or haven't used in months. If two services do the same job, consider which one you prefer.",
        "Be careful with annual plans you have already paid for. Cancel now may only stop the next renewal; it might not return money you've paid. Check the provider's terms rather than counting a refund you haven't received."
      ],
      "steps": [
        {
          "title": "Keep",
          "text": "You use it enough to justify its cost."
        },
        {
          "title": "Pause or downgrade",
          "text": "There is a cheaper option that still fits your needs, and the provider offers one."
        },
        {
          "title": "Cancel",
          "text": "The service is unused or no longer worth the fee, and you have checked the terms."
        }
      ]
    },
    {
      "id": "confirm",
      "heading": "6. Check that your cancellation worked",
      "paragraphs": [
        "Save an email, confirmation number or screenshot. Note the date your access and payments are meant to stop. Check your next statement for the expected charge.",
        "For a monthly plan you stop paying, you can record the actual fees avoided after the charge has stopped. Do not treat all the future months as money already saved. If the provider charges again, use your confirmation when following up."
      ]
    }
  ],
  "example": {
    "title": "A cancelled monthly plan",
    "premise": "Imagine you have two paid subscriptions and stop using one. One is A$9.99 a month and remains active because you use it. You cancel the unused A$14.99-a-month service, and future charges stop with no fee.",
    "lines": [
      "Unused service: A$14.99 each month",
      "A$14.99 × 12 months = A$179.88"
    ],
    "result": "Possible future charges avoided: A$179.88 over 12 months",
    "caution": "This is an invented example, not a saving for you. It is only a possible future amount if you stop all 12 payments, there is no fee and the service stays cancelled. Check your actual statements to record money saved."
  },
  "questions": [
    {
      "question": "Can I find all subscriptions in one place?",
      "answer": "Not always. Apple, Google, direct billing and different bank cards can each hold different subscriptions. Check them all."
    },
    {
      "question": "Does deleting an app cancel a subscription?",
      "answer": "No. For Google Play and Apple purchases, follow the subscription's cancellation steps rather than just deleting the app."
    },
    {
      "question": "Can I get a refund for an annual subscription?",
      "answer": "Not automatically. Check the provider's terms, the way you paid and any rights you may have. Do not count a refund until one is confirmed."
    },
    {
      "question": "Does SpendShift connect to my bank and cancel subscriptions?",
      "answer": "No. SpendShift never needs a bank connection. Its free check flags areas worth reviewing; the optional paid plan gives you steps, but you decide what to do."
    }
  ],
  "sources": [
    {
      "label": "Moneysmart: Track your spending",
      "url": "https://moneysmart.gov.au/budgeting/track-your-spending",
      "note": "How to check statements and find regular costs."
    },
    {
      "label": "Moneysmart: Get more value from your money",
      "url": "https://moneysmart.gov.au/budgeting/get-more-value-from-your-money",
      "note": "Tips on subscriptions, renewals and recurring bills."
    },
    {
      "label": "Apple Support Australia: Cancel a subscription",
      "url": "https://support.apple.com/en-au/118428",
      "note": "Official cancellation steps for subscriptions billed through Apple."
    },
    {
      "label": "Google Play Help: Cancel a subscription",
      "url": "https://support.google.com/googleplay/answer/7018481?co=GENIE.Platform%3DAndroidAnd&hl=en",
      "note": "Official guidance for subscriptions billed through Google Play."
    },
    {
      "label": "ACCC: Subscription traps",
      "url": "https://www.accc.gov.au/media-release/accc-warns-consumers-to-beware-of-subscription-traps",
      "note": "Information on automatic renewals and unclear subscription terms."
    }
  ],
  "related": [
    {
      "url": "/save-money-australia",
      "title": "12 ways to save money in Australia",
      "description": "More practical ways to check household spending."
    },
    {
      "url": "/reduce-electricity-bill-australia",
      "title": "Reduce your electricity bill",
      "description": "Learn how to check the bill and compare electricity offers."
    }
  ]
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://www.spendshift.com.au/cancel-unused-subscriptions-australia#article",
  headline: "How to find and cancel unused subscriptions in Australia",
  description: "Find forgotten subscriptions on bank statements, Apple and Google Play. Follow safe cancellation steps and check what you really save.",
  datePublished: "2026-11-14",
  dateModified: "2026-11-14",
  mainEntityOfPage: "https://www.spendshift.com.au/cancel-unused-subscriptions-australia",
  author: { "@type": "Organization", name: "SpendShift", url: "https://www.spendshift.com.au/" },
  publisher: { "@type": "Organization", name: "SpendShift", url: "https://www.spendshift.com.au/" },
  inLanguage: "en-AU",
};

export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><EditorialGuide guide={guide} /></>;
}
