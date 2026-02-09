import { Suspense } from 'react'
import InventoryPageContent from './InventoryPageContent'
import CSVImportModal from '@/components/inventory/CSVImportModal'

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    }>
      <InventoryPageContent importComponent={<CSVImportModal />} />
    </Suspense>
  )
}
