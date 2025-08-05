import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group",
      className
    )}
    {...props}
  >
    {/* The track of the slider with a soft rose background color */}
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-rose-100 dark:bg-rose-800/20">
      {/* The selected range, styled with a luxurious gradient */}
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-rose-400 to-pink-500" />
    </SliderPrimitive.Track>
    
    {/* The slider handle (thumb) with enhanced styling and hover effects */}
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-rose-500 bg-white shadow-md ring-offset-background transition-all duration-200 ease-in-out group-hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    
    {/* The Radix UI slider component handles rendering one or two thumbs based on the value prop automatically. 
        This second thumb is a template for when a range (an array with two values) is provided. */}
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-rose-500 bg-white shadow-md ring-offset-background transition-all duration-200 ease-in-out group-hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
