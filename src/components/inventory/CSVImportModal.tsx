'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  items: any[]
}

export default function CSVImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResult(null)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  async function handleImport() {
    if (!file) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
      
      if (response.ok && data.success > 0) {
        // Clear file after successful import
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      setResult({
        success: 0,
        failed: 1,
        errors: ['Network error occurred'],
        items: [],
      })
    } finally {
      setLoading(false)
    }
  }

  function downloadTemplate() {
    const template = `name,description,serialNumber,category,condition,notes
Tent 4-Person,4-person camping tent,T001,Camping,GOOD,Blue color
Sleeping Bag,Sleeping bag for cold weather,S001,Camping,EXCELLENT,
First Aid Kit,Basic first aid supplies,F001,Safety,GOOD,Check expiration dates
Cooking Stove,Portable gas stove,C001,Kitchen,FAIR,Needs new gas canister`;
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Upload className="h-4 w-4 mr-1" />
        Import CSV
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          setFile(null)
          setResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}
        title="Import Inventory from CSV"
        size="lg"
      >
        <div className="space-y-4">
          {/* Template Download */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              CSV Format Requirements
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Your CSV file should have these columns:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside mb-3">
              <li><strong>name</strong> (required) - Item name</li>
              <li><strong>category</strong> (required) - Category name</li>
              <li><strong>description</strong> - Item description</li>
              <li><strong>serialNumber</strong> - Unique serial number</li>
              <li><strong>condition</strong> - EXCELLENT, GOOD, FAIR, POOR, or DAMAGED</li>
              <li><strong>notes</strong> - Additional notes</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              <Download className="h-4 w-4 mr-1" />
              Download Template CSV
            </button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileText className="h-12 w-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'Click to select CSV file'}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Maximum file size: 5MB
              </span>
            </label>
          </div>

          {/* Results */}
          {result && (
            <div className={`p-4 rounded-lg ${result.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center mb-2">
                {result.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                )}
                <span className={`font-medium ${result.failed === 0 ? 'text-green-900' : 'text-yellow-900'}`}>
                  Import Results
                </span>
              </div>
              <p className={`text-sm ${result.failed === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                Successfully imported: {result.success} items
                {result.failed > 0 && ` | Failed: ${result.failed} items`}
              </p>
              
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-900 mb-1">Errors:</p>
                  <ul className="text-sm text-yellow-800 list-disc list-inside max-h-40 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || loading}
              isLoading={loading}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import Items
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
