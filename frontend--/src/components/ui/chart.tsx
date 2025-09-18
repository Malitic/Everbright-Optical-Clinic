import * as React from "react"
import { type ClassValue, clsx } from "clsx"; import { twMerge } from "tailwind-merge"; function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | undefined>(undefined)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider")
  }
  return context
}

const ChartProvider = ({
  config,
  children,
}: {
  config: ChartConfig
  children: React.ReactNode
}) => {
  return (
    <ChartContext.Provider value={{ config }}>
      {children}
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          [data-chart="${id}"] {
            --color-primary: ${config.primary?.color || "hsl(var(--chart-1))"};
            --color-secondary: ${config.secondary?.color || "hsl(var(--chart-2))"};
            --color-muted: ${config.muted?.color || "hsl(var(--chart-3))"};
            --color-background: ${config.background?.color || "hsl(var(--chart-background))"};
            --color-border: ${config.border?.color || "hsl(var(--chart-border))"};
          }
        `,
      }}
    />
  )
}

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
      className
    )}
    {...props}
  />
))
ChartTooltip.displayName = "ChartTooltip"

export {
  ChartProvider,
  ChartStyle,
  ChartTooltip,
  useChart,
}
