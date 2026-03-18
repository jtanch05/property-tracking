import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

/**
 * GlowingEffectDemo — Bento grid of PropTrack features
 * Uses the GlowingEffect component to create an interactive mouse-tracking
 * rainbow border glow on each card.
 *
 * Drop this anywhere you want a premium feature showcase, e.g. the landing page.
 */
export function GlowingEffectDemo() {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        title="Property Portfolio"
        description="Manage unlimited properties with detailed profiles, valuation history, and financial performance at a glance."
      />
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        title="Tenant Management"
        description="Complete tenant records, lease agreements, contact history, and payment status — all in one place."
      />
      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        title="Smart Alerts"
        description="Never miss a lease renewal, rent payment, or maintenance deadline. Customisable alert thresholds with frequency controls."
      />
      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        title="Cash Flow Analytics"
        description="Real-time income vs expense tracking, yield calculations, and exportable financial reports."
      />
      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        title="PDF Export"
        description="Generate professional statements client-side — no server upload required. Instant, private, and offline-ready."
      />
    </ul>
  );
}

const GridItem = ({ area, title, description }) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border border-white/[0.07] p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-center items-center text-center gap-2 rounded-xl border border-white/[0.07] bg-[#1c1c1c] p-6 shadow-sm md:p-6">
          <h3 className="text-xl font-semibold leading-snug tracking-tight text-[#f0f0f0] md:text-2xl">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-[#6b6b6b] md:text-base">
            {description}
          </p>
        </div>
      </div>
    </li>
  );
};
