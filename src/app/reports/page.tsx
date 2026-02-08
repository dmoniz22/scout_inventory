import { prisma } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Download, FileText, Package, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default async function ReportsPage() {
  // Get statistics
  const totalItems = await prisma.item.count({ where: { isActive: true } })
  const activeCheckouts = await prisma.checkout.count({
    where: { checkedInAt: null },
  })
  const overdueItems = await prisma.checkout.count({
    where: {
      checkedInAt: null,
      expectedReturn: { lt: new Date() },
    },
  })
  const totalMembers = await prisma.member.count({ where: { isActive: true } })

  // Get recent activity
  const recentCheckouts = await prisma.checkout.findMany({
    take: 10,
    orderBy: { checkedOutAt: 'desc' },
    include: {
      item: true,
      member: true,
    },
  })

  // Get all overdue items
  const overdueCheckouts = await prisma.checkout.findMany({
    where: {
      checkedInAt: null,
      expectedReturn: { lt: new Date() },
    },
    include: {
      item: true,
      member: true,
    },
    orderBy: { expectedReturn: 'asc' },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View inventory statistics and generate reports</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Items" value={totalItems} icon={Package} color="blue" />
        <StatCard title="Checked Out" value={activeCheckouts} icon={Clock} color="purple" />
        <StatCard title="Overdue" value={overdueItems} icon={AlertCircle} color="red" />
        <StatCard title="Members" value={totalMembers} icon={FileText} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card title="Recent Activity" subtitle="Last 10 checkouts/returns">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentCheckouts.map((checkout: typeof recentCheckouts[0]) => (
                  <tr key={checkout.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{checkout.item.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{checkout.member.name}</td>
                    <td className="px-4 py-2">
                      {checkout.checkedInAt ? (
                        <Badge variant="success">Returned</Badge>
                      ) : (
                        <Badge variant="warning">Checked Out</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Overdue Items */}
        <Card title="Overdue Items" subtitle={`${overdueItems} items need attention`}>
          {overdueCheckouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
              <p>No overdue items!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {overdueCheckouts.map((checkout: typeof overdueCheckouts[0]) => (
                    <tr key={checkout.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{checkout.item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{checkout.member.name}</td>
                      <td className="px-4 py-2 text-sm text-red-600">
                        {new Date(checkout.expectedReturn).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Export Options */}
      <Card title="Export Data" className="mt-6">
        <div className="flex flex-wrap gap-3">
          <ExportButton href="/api/export?type=items" label="Export Items (CSV)" />
          <ExportButton href="/api/export?type=checkouts" label="Export Checkout History (CSV)" />
          <ExportButton href="/api/export?type=overdue" label="Export Overdue Items (CSV)" />
        </div>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  }

  return (
    <div className={`${colors[color]} rounded-lg p-4`}>
      <div className="flex items-center">
        <Icon className="h-8 w-8 opacity-75" />
        <div className="ml-4">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ExportButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
      <Download className="h-4 w-4 mr-2" />
      {label}
    </a>
  )
}
