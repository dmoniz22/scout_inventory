'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, CheckCircle, AlertCircle, Download, X } from 'lucide-react'

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
    } else if (selectedFile) {
      alert('Please select a valid CSV file')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleClickUpload() {
    fileInputRef.current?.click()
  }

  function handleClearFile() {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

  function handleClose() {
    setIsOpen(false)
    setFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Upload className="h-4 w-4 mr-1" />
        Import CSV
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleClose}
            />
            
            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Import Inventory from CSV
                </h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-5 sm:p-6">
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
                  <div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {/* Clickable upload area */}
                    <button
                      onClick={handleClickUpload}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
                      type="button"
                    >
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600 font-medium block">
                        Click to select CSV file
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">
                        Maximum file size: 5MB
                      </span>
                    </button>

                    {/* File selected display */}
                    {file && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm text-green-800 font-medium">{file.name}</span>
                        </div>
                        <button
                          onClick={handleClearFile}
                          className="text-green-600 hover:text-green-800"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse">
                <Button
                  onClick={handleImport}
                  disabled={!file || loading}
                  isLoading={loading}
                  className="ml-3"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import Items
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
