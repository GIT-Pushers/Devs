import * as React from "react"
import { cn } from "@/lib/utils"

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children)
    const duplicatedChildren = [...childrenArray, ...childrenArray]
    
    return (
      <div
        ref={ref}
        className={cn("relative w-full overflow-hidden", className)}
        {...props}
      >
        <div className="flex animate-scroll gap-4">
          {duplicatedChildren}
        </div>
      </div>
    )
  }
)
Carousel.displayName = "Carousel"

export { Carousel }

