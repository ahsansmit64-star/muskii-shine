import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Nail by Muskii" },
      {
        name: "description",
        content:
          "Terms for ordering handmade press-on nails from Nail by Muskii: sizing, handcrafting time, hygiene returns, shipping and liability.",
      },
      { property: "og:title", content: "Terms and Conditions — Nail by Muskii" },
      {
        property: "og:description",
        content: "The rules that apply when you shop handmade press-on nails with Nail by Muskii.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

const INSTAGRAM = "https://www.instagram.com/nail_diaries_by_muskiii?igsh=Mnd3MXkzMHNiazZ6";

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Acceptance of terms",
    body: [
      "By using this website or placing an order with Nail by Muskii, you agree to these Terms and Conditions. If you do not agree, please do not use the site or place an order.",
      "We may update these terms from time to time. The version shown on this page when you place your order is the one that applies to that order.",
    ],
  },
  {
    title: "2. Products and sizing",
    body: [
      "Our press-on nails are cosmetic items for personal use. They are handmade, so small differences between sets are normal and are not treated as defects.",
      "You are responsible for choosing the correct size (XS, S, M, L, or custom measurements in millimetres). Please measure each nail carefully before ordering. We cannot accept returns or remake sets because the wrong size was selected.",
      "Colours may look slightly different in person because of screen settings, device displays and lighting in product photos.",
    ],
  },
  {
    title: "3. Order processing and handcrafting time",
    body: [
      "Every set is painted and finished by hand after you order. Standard sets usually take 3 to 5 working days to make. Custom or detailed designs can take 5 to 10 working days.",
      "These are estimates, not guarantees. During busy periods or holidays it may take longer. We will contact you on the phone number you gave us if there is a major delay.",
      "Once production has started, orders cannot be cancelled or changed.",
    ],
  },
  {
    title: "4. Hygiene and returns",
    body: [
      "For hygiene and sanitary reasons, all sales of press-on nails and application kits are final. Once an order has shipped, it cannot be refunded, returned or exchanged.",
      "The only exception is an item that arrives damaged or defective. In that case, contact us within 48 hours of delivery with clear photos of the item and its packaging. If we confirm the problem, we will repair, replace or refund the affected item at our choice.",
      "Items that have been opened, tried on, glued or worn cannot be returned for any reason other than a confirmed defect.",
    ],
  },
  {
    title: "5. Shipping, customs and import fees",
    body: [
      "Delivery times shown on the site are estimates. Delays caused by courier companies, weather or events outside our control are not our responsibility.",
      "You are responsible for entering a complete and correct delivery address and an active phone number. If a parcel is returned because of a wrong address or because the courier could not reach you, re-delivery charges will be paid by you.",
      "For deliveries outside Pakistan, any customs duties, import taxes or local fees are paid by the customer.",
    ],
  },
  {
    title: "6. Proper use and limitation of liability",
    body: [
      "Please follow the application instructions included with your set. Do a patch test with the glue or adhesive tabs before full use, and stop using the product if you notice redness, itching or irritation.",
      "Nail by Muskii is not responsible for damage to natural nails, allergic reactions to nail glue or adhesive tabs, injury from improper application or removal, or normal wear and tear such as chipping, lifting or fading over time.",
      "To the fullest extent allowed by law, our total liability for any order is limited to the amount you paid for that order.",
    ],
  },
  {
    title: "7. Intellectual property",
    body: [
      "All nail designs, product photos, the 3D background and visual effects, logos, text and other content on this website belong to Nail by Muskii or its licensors.",
      "You may not copy, reproduce, resell or use any of this content, including our designs, for commercial purposes without our written permission.",
    ],
  },
  {
    title: "8. Governing law and contact",
    body: [
      "These terms are governed by the laws of Pakistan. Any dispute will be handled by the courts of Pakistan.",
      "Nail by Muskii is an online store based in Pakistan. For questions about an order or these terms, message us on Instagram at @nail_diaries_by_muskiii.",
    ],
  },
];

function Terms() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary">Terms and Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>
      <div className="mt-8 grid gap-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <a
        href={INSTAGRAM}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-10 inline-flex min-h-12 items-center rounded-md border border-gold px-4 text-sm font-semibold text-primary hover:bg-gold hover:text-accent-foreground"
      >
        Contact us on Instagram
      </a>
    </main>
  );
}
