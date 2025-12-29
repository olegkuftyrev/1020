import { useMemo } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router-dom'
import { getProductStatistics, getCategorySummary, type ProductStatistics, type CategorySummary } from '@/utils/productsApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

function StatCard({ title, value, subtitle, isLoading }: { title: string; value: string | number; subtitle?: string; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-1" />
        {subtitle && <Skeleton className="h-3 w-40" />}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 hover:border-primary/40 transition-all duration-200">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function CategoryCard({ category, summary }: { category: CategorySummary }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card/60 p-4 hover:border-primary/40 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground">{category.group}</h4>
        <span className="text-sm text-muted-foreground">{category.productCount} products</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs mb-1">Avg Usage</div>
          <div className="font-medium text-foreground">{category.averageUsage.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs mb-1">Avg CS/1k</div>
          <div className="font-medium text-foreground">
            {category.averageCsPer1k > 0 ? category.averageCsPer1k.toFixed(2) : '-'}
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Conversion Rate</span>
            <span className="font-medium text-foreground">{category.conversionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-primary/10 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min(category.conversionRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { data: statistics, isLoading: statsLoading, error: statsError } = useSWR<ProductStatistics>(
    '/products/statistics',
    getProductStatistics,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  const { data: categorySummary, isLoading: categoryLoading, error: categoryError } = useSWR<CategorySummary[]>(
    '/products/category-summary',
    getCategorySummary,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  const formattedLastUpdate = useMemo(() => {
    if (!statistics?.lastUpdate) return 'Never'
    try {
      const date = new Date(statistics.lastUpdate)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Unknown'
    }
  }, [statistics?.lastUpdate])

  const topCategories = useMemo(() => {
    if (!categorySummary) return []
    return categorySummary.slice(0, 6)
  }, [categorySummary])

  const isLoading = statsLoading || categoryLoading
  const hasError = statsError || categoryError

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
            Dashboard Overview
          </h2>
          <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow"></div>
        </div>
        
        {hasError && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/20 p-4 text-red-400 mb-4">
            Error loading dashboard data. Please try refreshing the page.
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={statistics?.totalProducts ?? 0}
          subtitle="All products in database"
          isLoading={isLoading}
        />
        <StatCard
          title="With Conversion"
          value={statistics?.productsWithConversion ?? 0}
          subtitle={`${statistics ? ((statistics.productsWithConversion / statistics.totalProducts) * 100).toFixed(1) : 0}% of total`}
          isLoading={isLoading}
        />
        <StatCard
          title="Without Conversion"
          value={statistics?.productsWithoutConversion ?? 0}
          subtitle="Needs conversion data"
          isLoading={isLoading}
        />
        <StatCard
          title="Last Update"
          value={formattedLastUpdate}
          subtitle="Data synchronization"
          isLoading={isLoading}
        />
      </div>

      {/* Category Distribution */}
      {statistics && statistics.productsByGroup.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Products by Category</h3>
            <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
          </div>
          
          {categoryLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-lg border border-primary/20 bg-card/60 p-4">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : categoryError ? (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load category data
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topCategories.map((category) => (
                <CategoryCard key={category.group} category={category} />
              ))}
            </div>
          )}

          {categorySummary && categorySummary.length > 6 && (
            <div className="mt-6 text-center">
              <Link to="/store-data">
                <Button variant="outline" className="iron-border">
                  View All Categories
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">Quick Actions</h3>
          <div className="h-1 w-16 bg-primary/60 rounded-full"></div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/store-data">
            <div className="rounded-lg border border-primary/20 bg-card/60 p-6 hover:border-primary/40 transition-all cursor-pointer">
              <h4 className="font-semibold text-foreground mb-2">Manage Products</h4>
              <p className="text-sm text-muted-foreground">
                View and edit product data, upload PDF files
              </p>
            </div>
          </Link>
          <Link to="/reports">
            <div className="rounded-lg border border-primary/20 bg-card/60 p-6 hover:border-primary/40 transition-all cursor-pointer">
              <h4 className="font-semibold text-foreground mb-2">View Reports</h4>
              <p className="text-sm text-muted-foreground">
                Generate reports and export data
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

