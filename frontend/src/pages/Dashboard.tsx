export function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
            Welcome Back
          </h2>
          <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow"></div>
        </div>
        
        <div className="space-y-3">
          <p className="text-muted-foreground text-base md:text-lg">
            Store dashboard for internal use
          </p>
          <p className="text-foreground/90">
            Welcome to the dashboard. Your data will appear here.
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 hover:border-primary/40 transition-all duration-200">
          <h3 className="font-semibold text-foreground mb-2">Quick Stats</h3>
          <p className="text-muted-foreground text-sm">View store statistics</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 hover:border-primary/40 transition-all duration-200">
          <h3 className="font-semibold text-foreground mb-2">Recent Activity</h3>
          <p className="text-muted-foreground text-sm">Monitor store operations</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 hover:border-primary/40 transition-all duration-200">
          <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
          <p className="text-muted-foreground text-sm">Performance insights</p>
        </div>
      </div>
    </div>
  )
}

