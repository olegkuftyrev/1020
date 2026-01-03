import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function EasyLearning() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
          Easy Learning
        </h2>
        <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow mb-6"></div>
        
        <div className="rounded-lg border border-primary/20 bg-card/60 p-6">
          <p className="text-muted-foreground mb-4">
            Content coming soon...
          </p>
          
          <Link to="/pl-questions">
            <Button variant="outline" size="lg" className="iron-border">
              P&L Questions
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

