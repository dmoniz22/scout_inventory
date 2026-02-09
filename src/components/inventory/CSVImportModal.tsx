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
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
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

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Upload className="h-4 w-4 mr-1" />
        Import CSV
      </Button>
    )
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            Import Inventory from CSV
          </h2>
          <button 
            onClick={handleClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Template Download */}
          <div style={{ 
            backgroundColor: '#eff6ff', 
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              CSV Format Requirements
            </h3>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              Your CSV file should have these columns:
            </p>
            <ul style={{ fontSize: '14px', marginBottom: '12px', paddingLeft: '20px' }}>
              <li><strong>name</strong> (required) - Item name</li>
              <li><strong>category</strong> (required) - Category name</li>
              <li><strong>description</strong> - Item description</li>
              <li><strong>serialNumber</strong> - Unique serial number</li>
              <li><strong>condition</strong> - EXCELLENT, GOOD, FAIR, POOR, or DAMAGED</li>
              <li><strong>notes</strong> - Additional notes</li>
            </ul>
            <button
              onClick={downloadTemplate}
              style={{ 
                fontSize: '14px', 
                color: '#1d4ed8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Download Template CSV
            </button>
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '20px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <button
              onClick={handleClickUpload}
              style={{
                width: '100%',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'transparent'
              }}
              type="button"
            >
              <FileText className="h-12 w-12 mx-auto mb-2" style={{ color: '#9ca3af' }} />
              <span style={{ fontSize: '14px', fontWeight: 500, display: 'block' }}>
                Click to select CSV file
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                Maximum file size: 5MB
              </span>
            </button>

            {file && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FileText className="h-5 w-5 mr-2" style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{file.name}</span>
                </div>
                <button
                  onClick={handleClearFile}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  type="button"
                >
                  <X className="h-4 w-4" style={{ color: '#16a34a' }} />
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div style={{ 
              padding: '16px', 
              borderRadius: '6px',
              marginBottom: '20px',
              backgroundColor: result.failed === 0 ? '#f0fdf4' : '#fefce8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                {result.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 mr-2" style={{ color: '#16a34a' }} />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" style={{ color: '#ca8a04' }} />
                )}
                <span style={{ fontWeight: 600 }}>
                  Import Results
                </span>
              </div>
              <p style={{ fontSize: '14px' }}>
                Successfully imported: {result.success} items
                {result.failed > 0 && ` | Failed: ${result.failed} items`}
              </p>
              
              {result.errors.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Errors:</p>
                  <ul style={{ fontSize: '14px', paddingLeft: '20px', maxHeight: '160px', overflow: 'auto' }}>
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="ghost" onClick={handleClose}>
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
      </div>
    </div>
  )
}
