import React from "react";
import { KPICard } from "@/src/components/KPICard";
import { Shell } from "@/src/components/Shell";
import { Separator } from "@/src/components/ui/separator";

export default function KPIDemoPage() {
  return (
    <Shell>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KPI Card Demo</h1>
          <p className="text-muted-foreground">
            Showcase of different KPI card variants for displaying key performance indicators
          </p>
        </div>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4">Basic KPI Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Revenue"
              value="$24,580"
              delta={12.2}
              description="vs. previous period"
              trend={[35, 40, 30, 45, 55, 60, 43, 65, 58, 70]}
              tooltipContent="Total revenue generated from all campaigns in the current period"
            />
            
            <KPICard
              title="ROAS"
              value={2.8}
              suffix="x"
              delta={-5.4}
              description="vs. previous period"
              trend={[55, 60, 58, 50, 47, 45, 43, 40, 35, 30]}
              tooltipContent="Return on Ad Spend (ROAS) measures the effectiveness of advertising campaigns"
            />
            
            <KPICard
              title="Conversion Rate"
              value={3.24}
              suffix="%"
              delta={0.8}
              description="vs. previous period"
              trend={[2.2, 2.4, 2.6, 2.8, 3.0, 3.1, 3.0, 3.2, 3.3, 3.24]}
              tooltipContent="Percentage of visitors who took the desired action"
            />
            
            <KPICard
              title="CPA"
              prefix="$"
              value={18.25}
              delta={-11.5}
              description="vs. previous period"
              trend={[25, 23, 22, 20, 19, 18.5, 19, 18.25]}
              tooltipContent="Cost Per Acquisition - average cost to acquire a customer"
            />
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4">Color Schemes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Default KPI"
              value="$18,924"
              delta={5.3}
              colorScheme="default"
              tooltipContent="Uses default color scheme"
            />
            
            <KPICard
              title="Success KPI"
              value="2.4x"
              delta={8.7}
              colorScheme="success"
              tooltipContent="Uses success color scheme"
            />
            
            <KPICard
              title="Warning KPI"
              value="65%"
              delta={-2.3}
              colorScheme="warning"
              tooltipContent="Uses warning color scheme"
            />
            
            <KPICard
              title="Error KPI"
              value="$32.50"
              delta={-12.4}
              colorScheme="error"
              tooltipContent="Uses error color scheme"
            />

            <KPICard
              title="Info KPI"
              value="1,284"
              delta={3.6}
              colorScheme="info"
              tooltipContent="Uses info color scheme"
            />
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Small Size"
              value="$12,435"
              delta={4.2}
              size="sm"
              valueSize="sm"
              tooltipContent="Small sized KPI card"
            />
            
            <KPICard
              title="Medium Size"
              value="$18,924"
              delta={5.3}
              size="md"
              valueSize="md"
              tooltipContent="Medium sized KPI card"
            />
            
            <KPICard
              title="Large Size"
              value="$24,580"
              delta={12.2}
              size="lg"
              valueSize="lg"
              tooltipContent="Large sized KPI card"
            />
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4">Loading State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Loading KPI"
              value="0"
              isLoading={true}
            />
          </div>
        </section>
      </div>
    </Shell>
  );
} 