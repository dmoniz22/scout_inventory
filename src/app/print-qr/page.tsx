import { Suspense } from 'react'
import QRPrintPageContent from './QRPrintPageContent'

export default function QRPrintPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <QRPrintPageContent />
    </Suspense>
  )
}
