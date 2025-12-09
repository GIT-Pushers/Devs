import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function UserStatusPanel() {
  return (
    <Card className="border-border bg-muted/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-foreground" />
          <div>
            <p className="font-semibold">Wallet Connected</p>
            <p className="text-sm text-muted-foreground">
              0x1234...5678
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

