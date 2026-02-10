'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, CheckCircle, AlertCircle, Download, X } from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  members: any[]
}

export default function MemberImportModal() {
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

      const response = await fetch('/api/members/import', {
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
      console.error('Error importing members:', error)
      setResult({
        success: 0,
        failed: 1,
        errors: ['Network error occurred'],
        members: [],
      })
    } finally {
      setLoading(false)
    }
  }

  function downloadTemplate() {
    const template = `name,email,phone,role
John Smith,john@example.com,+1234567890,MEMBER
Jane Doe,jane@example.com,+1234567891,LEADER
Bob Wilson,bob@example.com,,MEMBER`;
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'members_template.csv'
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
        Import Members
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
            Import Members from CSV
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
          <div className="space-y-4">
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
                <li><strong>name</strong> (required) - Member name</li>
                <li><strong>email</strong> - Email address (must be unique)</li>
                <li><strong>phone</strong> - Phone number</li>
                <li><strong>role</strong> - ADMIN, LEADER, or MEMBER (defaults to MEMBER)</li>
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
                  Successfully imported: {result.success} members
                  {result.failed > 0 && ` | Failed: ${result.failed} members`}
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
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: '#f9fafb', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            variant="ghost"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            isLoading={loading}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import Members
          </Button>
        </div>
      </div>
    </div>
  )
}
