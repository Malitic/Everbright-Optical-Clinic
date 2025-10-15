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

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
  }
>(({ className, config, ...props }, ref) => {
  const id = React.useId()
  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      data-chart={id}
      {...props}
    >
      <ChartStyle id={id} config={config} />
      {props.children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    payload?: any[]
    label?: string
  }
>(({ className, active, payload, label, ...props }, ref) => {
  const { config } = useChart()

  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  const formattedLabel = label

  return (
    <div
      ref={ref}
      className={cn("grid min-w-[12rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl", className)}
      {...props}
    >
      <div className="font-medium">{formattedLabel}</div>
      <div className="grid gap-2">
        {payload.map((entry, index) => {
          const configItem = config[entry.dataKey]
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: configItem?.color || `hsl(var(--chart-${index + 1}))` }}
              />
              <span>{configItem?.label || entry.dataKey}: {entry.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export {
  ChartProvider,
  ChartStyle,
  ChartTooltip,
  ChartContainer,
  ChartTooltipContent,
  useChart,
}
