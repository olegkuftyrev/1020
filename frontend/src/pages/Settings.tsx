import { useState } from 'react'
import useSWR from 'swr'
import { getProductStatistics, getPdfMetadata, type ProductStatistics } from '@/utils/productsApi'
import { pdfMetadataFetcher } from '@/utils/productsApi'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function InfoRow({ label, value, isLoading }: { label: string; value: string | number | null; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-primary/10 last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value ?? 'N/A'}</span>
    </div>
  )
}

export function Settings() {
  const { logout } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const { data: statistics, isLoading: statsLoading } = useSWR<ProductStatistics>(
    '/products/statistics',
    getProductStatistics,
    { revalidateOnFocus: false }
  )

  const { data: pdfMetadata, isLoading: metadataLoading } = useSWR(
    '/products/metadata/pdf',
    pdfMetadataFetcher,
    { revalidateOnFocus: false }
  )

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const isLoading = statsLoading || metadataLoading

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground iron-text-glow">
            Settings
          </h2>
          <div className="h-1 w-24 bg-primary/60 rounded-full iron-glow"></div>
        </div>
      </div>

      {/* System Information */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h3 className="text-xl font-bold text-foreground mb-4">System Information</h3>
        
        <div className="space-y-1">
          <InfoRow
            label="Application Name"
            value="Panda Express Dashboard"
            isLoading={false}
          />
          <InfoRow
            label="Version"
            value="1.0.0"
            isLoading={false}
          />
          <InfoRow
            label="Environment"
            value={import.meta.env.MODE || 'production'}
            isLoading={false}
          />
          <InfoRow
            label="Build Date"
            value={new Date().toLocaleDateString()}
            isLoading={false}
          />
        </div>
      </div>

      {/* Database Statistics */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h3 className="text-xl font-bold text-foreground mb-4">Database Statistics</h3>
        
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map(i => (
              <InfoRow key={i} label="Loading..." value="..." isLoading={true} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <InfoRow
              label="Total Products"
              value={statistics?.totalProducts ?? 0}
            />
            <InfoRow
              label="Products with Conversion"
              value={statistics?.productsWithConversion ?? 0}
            />
            <InfoRow
              label="Products without Conversion"
              value={statistics?.productsWithoutConversion ?? 0}
            />
            <InfoRow
              label="Categories"
              value={statistics?.productsByGroup.length ?? 0}
            />
            <InfoRow
              label="Last Data Update"
              value={formatDate(statistics?.lastUpdate ?? null)}
            />
          </div>
        )}

        {statistics && statistics.productsByGroup.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">Products by Category</h4>
            <div className="rounded-lg border border-primary/20 bg-card/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.productsByGroup.map((item) => (
                    <TableRow key={item.group} className="hover:bg-primary/5">
                      <TableCell className="font-medium">{item.group}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* PDF Metadata */}
      {pdfMetadata && (
        <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-foreground mb-4">PDF Information</h3>
          
          <div className="space-y-1">
            <InfoRow
              label="PDF Title"
              value={pdfMetadata.title || 'N/A'}
            />
            <InfoRow
              label="Page Count"
              value={pdfMetadata.pageCount ?? 0}
            />
            <InfoRow
              label="Last Updated"
              value={formatDate((pdfMetadata as any).updatedAt || (pdfMetadata as any).createdAt)}
            />
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h3 className="text-xl font-bold text-foreground mb-4">Account</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Sign out from your account. You will need to enter your password to access the dashboard again.
            </p>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="iron-border"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        <h3 className="text-xl font-bold text-foreground mb-4">About</h3>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Panda Express Store Dashboard is an internal tool for managing store data,
            analyzing product usage, and generating reports.
          </p>
          <p>
            This application allows you to upload PDF files, parse product data,
            and generate detailed reports for store operations.
          </p>
        </div>
      </div>
    </div>
  )
}

