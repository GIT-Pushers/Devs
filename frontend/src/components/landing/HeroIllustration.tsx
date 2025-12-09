export function HeroIllustration() {
  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px]">
      <div className="absolute inset-0 bg-foreground/5 rounded-3xl blur-3xl" />
      <div className="relative h-full bg-muted/30 rounded-3xl border border-border flex items-center justify-center">
        <div className="grid grid-cols-3 gap-4 p-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-foreground/20 rounded-lg animate-pulse border border-border"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

