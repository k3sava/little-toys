// Schema.org @graph helpers for the toys hub. Static-export friendly.

import type { ReactNode } from "react";
import { allToys, groups } from "@/data/toys";

export const SITE = "https://toys.iamkesava.com";

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function rootLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": SITE + "/#site",
        name: "little toys",
        alternateName: "Kesava's creative experiments",
        description:
          "Creative experiments by Kesava: interactive audio toys, generative visuals, physics simulations, and CSS art.",
        url: SITE + "/",
        publisher: { "@id": SITE + "/#org" },
        sameAs: [
          "https://tools.iamkesava.com/",
          "https://apps.iamkesava.com/",
          "https://codex.iamkesava.com/",
          "https://iamkesava.com/",
        ],
      },
      {
        "@type": "Organization",
        "@id": SITE + "/#org",
        name: "Kami Studios",
        url: "https://iamkesava.com",
        founder: { "@type": "Person", name: "Kesava", url: "https://iamkesava.com" },
        sameAs: ["https://github.com/k3sava", "https://www.linkedin.com/in/k3sava"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "iamkesava", item: "https://iamkesava.com" },
          { "@type": "ListItem", position: 2, name: "apps", item: "https://apps.iamkesava.com" },
          { "@type": "ListItem", position: 3, name: "toys", item: SITE + "/" },
        ],
      },
      {
        "@type": "ItemList",
        name: "Creative experiments",
        numberOfItems: allToys.length,
        itemListElement: allToys.map((toy, i) => {
          const canonical = toy.slug && !toy.external
            ? `${SITE}/${toy.slug}/`
            : toy.href.startsWith("/")
              ? SITE + toy.href
              : toy.href;
          const work = {
            "@type": "CreativeWork",
            name: toy.title,
            description: toy.description,
            url: canonical,
            keywords: toy.badge,
            author: { "@type": "Person", name: "Kesava" },
            ...(toy.slug ? { codeRepository: `https://github.com/k3sava/${toy.slug}` } : {}),
          };
          return {
            "@type": "ListItem",
            position: i + 1,
            item: work,
          };
        }),
      },
      // FAQ block — answers the questions an AI agent would ask about this hub.
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What are little toys?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `${allToys.length} small creative experiments by Kesava. Audio toys, generative visuals, physics simulations, and CSS art. All free, all in your browser.`,
            },
          },
          {
            "@type": "Question",
            name: "Are they free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Free, ad-free, no signup, no tracking. Each toy runs entirely in your browser.",
            },
          },
          {
            "@type": "Question",
            name: "How are they categorized?",
            acceptedAnswer: {
              "@type": "Answer",
              text: groups.map((g) => `${g.label} (${g.apps.length})`).join(", "),
            },
          },
        ],
      },
    ],
  };
}

export function JsonLdRoot({ children }: { children?: ReactNode }) {
  return (
    <>
      <JsonLd data={rootLd()} />
      {children}
    </>
  );
}
