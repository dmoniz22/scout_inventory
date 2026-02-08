import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { Package, Users, Clock, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

async function getDashboardStats() {
  const totalItems = await prisma.item.count({ where: { isActive: true } });
  
  const activeCheckouts = await prisma.checkout.count({
    where: { checkedInAt: null },
  });
  
  const availableItems = totalItems - activeCheckouts;
  
  const overdueItems = await prisma.checkout.count({
    where: {
      checkedInAt: null,
      expectedReturn: { lt: new Date() },
    },
  });
  
  const totalMembers = await prisma.member.count({ where: { isActive: true } });
  
  const recentCheckouts = await prisma.checkout.findMany({
    where: { checkedInAt: null },
    take: 5,
    orderBy: { checkedOutAt: "desc" },
    include: {
      item: { include: { category: true } },
      member: true,
    },
  });
  
  return {
    totalItems,
    availableItems,
    checkedOutItems: activeCheckouts,
    overdueItems,
    totalMembers,
    recentCheckouts,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your scout group equipment inventory
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Available"
          value={stats.availableItems}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Checked Out"
          value={stats.checkedOutItems}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueItems}
          icon={AlertCircle}
          color="red"
          alert={stats.overdueItems > 0}
        />
        <StatCard
          title="Members"
          value={stats.totalMembers}
          icon={Users}
          color="orange"
        />
      </div>
      
      {/* Recent Checkouts */}
      <Card
        title="Currently Checked Out"
        subtitle={`${stats.recentCheckouts.length} items currently on loan`}
      >
        {stats.recentCheckouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No items are currently checked out</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Borrowed By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentCheckouts.map((checkout) => {
                  const isOverdue = new Date(checkout.expectedReturn) < new Date();
                  return (
                    <tr key={checkout.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {checkout.item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkout.item.category.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {checkout.member.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(checkout.expectedReturn).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {isOverdue ? (
                          <Badge variant="error">Overdue</Badge>
                        ) : (
                          <Badge variant="success">On Time</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Link
            href="/scan"
            className="text-purple-600 hover:text-purple-800 font-medium text-sm"
          >
            Scan to check in/out →
          </Link>
        </div>
      </Card>
      
      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickActionCard
          title="Add New Item"
          description="Add equipment to your inventory"
          href="/inventory/new"
          color="blue"
        />
        <QuickActionCard
          title="Scan QR Code"
          description="Quickly check items in or out"
          href="/scan"
          color="green"
        />
        <QuickActionCard
          title="View Reports"
          description="See borrowing history and stats"
          href="/reports"
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  alert = false,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  alert?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4 ${alert ? "ring-2 ring-red-500" : ""}`}>
      <div className="flex items-center">
        <Icon className="h-8 w-8 opacity-75" />
        <div className="ml-4">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "hover:border-blue-500 hover:bg-blue-50",
    green: "hover:border-green-500 hover:bg-green-50",
    purple: "hover:border-purple-500 hover:bg-purple-50",
  };

  return (
    <Link
      href={href}
      className={`block p-6 bg-white rounded-lg border-2 border-gray-200 transition-all ${colors[color]}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
