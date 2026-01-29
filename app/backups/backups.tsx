'use client'

import { useState, useRef } from 'react'
import { PageHeader } from '@/app/components/page-header'
import { Button, Text, Badge, Select } from '@medusajs/ui'
import { ArrowDownTray, ArrowUpTray, Check, XMark } from '@medusajs/icons'
import { format } from 'date-fns'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const tables = [
  { name: 'Contact Submissions', key: 'contact_submissions' },
  { name: 'Quote Requests', key: 'quote_requests' },
  { name: 'Sample Requests', key: 'sample_requests' },
  { name: 'Feedback', key: 'feedback_submissions' },
  { name: 'Product Requests', key: 'product_requests' },
  { name: 'Call Requests', key: 'call_requests' },
]

interface ImportResult {
  table: string
  success: number
  failed: number
  errors: string[]
}

export function BackupsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDataForExport = (data: Record<string, unknown>[]) => {
    return data.map((item) => {
      const formatted: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(item)) {
        if (key === 'created_at') {
          formatted['Date'] = format(new Date(value as string), 'MMM d, yyyy h:mm a')
        } else if (key === 'id') {
          formatted['ID'] = value
        } else if (key === 'resolved') {
          formatted['Status'] = value ? 'Resolved' : 'Pending'
        } else if (key === 'vaulted') {
          formatted['Vaulted'] = value ? 'Yes' : 'No'
        } else if (Array.isArray(value)) {
          formatted[formatKey(key)] = value.join(', ')
        } else if (typeof value === 'object' && value !== null) {
          formatted[formatKey(key)] = JSON.stringify(value)
        } else {
          formatted[formatKey(key)] = value ?? ''
        }
      }
      return formatted
    })
  }

  const generateExcel = (data: Record<string, unknown>[], title: string) => {
    const formatted = formatDataForExport(data)
    const ws = XLSX.utils.json_to_sheet(formatted)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title)
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  }

  const generatePDF = (data: Record<string, unknown>[], title: string) => {
    const formatted = formatDataForExport(data)
    if (formatted.length === 0) return null

    const doc = new jsPDF('landscape')
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 22)

    const headers = Object.keys(formatted[0])
    const rows = formatted.map((item) => headers.map((h) => String(item[h] ?? '')))

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 100, 100] },
    })

    return doc.output('arraybuffer')
  }

  const generateCSV = (data: Record<string, unknown>[]) => {
    const formatted = formatDataForExport(data)
    if (formatted.length === 0) return ''

    const headers = Object.keys(formatted[0])
    const csvRows = [
      headers.join(','),
      ...formatted.map((row) =>
        headers
          .map((h) => {
            const value = String(row[h] ?? '')
            return `"${value.replace(/"/g, '""')}"`
          })
          .join(',')
      ),
    ]
    return csvRows.join('\n')
  }

  const generateTXT = (data: Record<string, unknown>[], title: string) => {
    const formatted = formatDataForExport(data)
    if (formatted.length === 0) return ''

    let txtContent = `${title}\n`
    txtContent += `Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}\n`
    txtContent += '='.repeat(50) + '\n\n'

    formatted.forEach((item, index) => {
      txtContent += `Record ${index + 1}\n`
      txtContent += '-'.repeat(30) + '\n'
      for (const [key, value] of Object.entries(item)) {
        txtContent += `${key}: ${value}\n`
      }
      txtContent += '\n'
    })

    return txtContent
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const zip = new JSZip()
      const dateStr = format(new Date(), 'yyyy-MM-dd')

      const tablesToExport = selectedTable === 'all'
        ? tables
        : tables.filter(t => t.key === selectedTable)

      for (const table of tablesToExport) {
        const response = await fetch(`/api/submissions?table=${table.key}`)
        const result = await response.json()
        const data = result.data || []

        if (data.length === 0) continue

        const folder = zip.folder(table.key)
        if (!folder) continue

        // JSON
        folder.file(`${table.key}.json`, JSON.stringify(data, null, 2))

        // CSV
        const csv = generateCSV(data)
        if (csv) folder.file(`${table.key}.csv`, csv)

        // Excel
        const excel = generateExcel(data, table.name)
        folder.file(`${table.key}.xlsx`, excel)

        // PDF
        const pdf = generatePDF(data, table.name)
        if (pdf) folder.file(`${table.key}.pdf`, pdf)

        // TXT
        const txt = generateTXT(data, table.name)
        if (txt) folder.file(`${table.key}.txt`, txt)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `graycup-backup-${dateStr}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to create backup. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const parseCSV = (csvText: string): Record<string, unknown>[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const data: Record<string, unknown>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const row: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        const originalKey = header
          .split(' ')
          .map((word, i) => i === 0 ? word.toLowerCase() : word)
          .join('')
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '')

        let value: unknown = values[index] || ''

        // Convert back from formatted values
        if (originalKey === 'status' || header === 'Status') {
          row['resolved'] = value === 'Resolved'
        } else if (originalKey === 'vaulted' || header === 'Vaulted') {
          row['vaulted'] = value === 'Yes'
        } else if (originalKey === 'date' || header === 'Date') {
          // Skip date as it's generated from created_at
        } else {
          row[originalKey] = value
        }
      })

      if (Object.keys(row).length > 0) {
        data.push(row)
      }
    }

    return data
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsImporting(true)
    setImportResults([])
    const results: ImportResult[] = []

    try {
      for (const file of Array.from(files)) {
        const fileName = file.name.toLowerCase()
        const isCSV = fileName.endsWith('.csv')
        const isJSON = fileName.endsWith('.json')

        if (!isCSV && !isJSON) {
          results.push({
            table: file.name,
            success: 0,
            failed: 0,
            errors: ['Only JSON and CSV files are supported']
          })
          continue
        }

        const content = await file.text()
        let data: Record<string, unknown>[]

        try {
          if (isJSON) {
            data = JSON.parse(content)
            if (!Array.isArray(data)) {
              data = [data]
            }
          } else {
            data = parseCSV(content)
          }
        } catch (parseError) {
          results.push({
            table: file.name,
            success: 0,
            failed: 0,
            errors: [`Failed to parse file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`]
          })
          continue
        }

        // Try to determine the table from filename
        let detectedTable = ''
        for (const table of tables) {
          if (fileName.includes(table.key)) {
            detectedTable = table.key
            break
          }
        }

        if (!detectedTable) {
          results.push({
            table: file.name,
            success: 0,
            failed: data.length,
            errors: ['Could not determine table from filename. Filename should contain table name (e.g., contact_submissions.json)']
          })
          continue
        }

        // Import data
        const response = await fetch('/api/backups/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: detectedTable, data })
        })

        const result = await response.json()

        results.push({
          table: `${detectedTable} (${file.name})`,
          success: result.success || 0,
          failed: result.failed || 0,
          errors: result.errors || []
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      results.push({
        table: 'Import',
        success: 0,
        failed: 0,
        errors: ['An unexpected error occurred during import']
      })
    } finally {
      setImportResults(results)
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Backups"
        description="Create, export, and import data backups"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-ui-bg-subtle rounded-lg">
              <ArrowDownTray className="w-5 h-5 text-ui-fg-base" />
            </div>
            <div>
              <Text className="font-medium text-ui-fg-base">Export Backup</Text>
              <Text className="text-sm text-ui-fg-subtle">Download all data as a ZIP file</Text>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Text className="text-sm text-ui-fg-muted mb-2">Select Data</Text>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <Select.Trigger className="w-full">
                  <Select.Value placeholder="Select tables to export" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Tables</Select.Item>
                  {tables.map((table) => (
                    <Select.Item key={table.key} value={table.key}>
                      {table.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div className="bg-ui-bg-subtle rounded-md p-3">
              <Text className="text-xs text-ui-fg-muted mb-2">Included Formats</Text>
              <div className="flex flex-wrap gap-2">
                {['CSV', 'JSON', 'Excel', 'PDF', 'TXT'].map((fmt) => (
                  <Badge key={fmt} color="grey">{fmt}</Badge>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleExport}
              disabled={isExporting}
            >
              <ArrowDownTray className="w-4 h-4 mr-2" />
              {isExporting ? 'Creating Backup...' : 'Download Backup (ZIP)'}
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-ui-bg-subtle rounded-lg">
              <ArrowUpTray className="w-5 h-5 text-ui-fg-base" />
            </div>
            <div>
              <Text className="font-medium text-ui-fg-base">Import Data</Text>
              <Text className="text-sm text-ui-fg-subtle">Restore from JSON or CSV files</Text>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-ui-bg-subtle rounded-md p-3">
              <Text className="text-xs text-ui-fg-muted mb-2">Supported Formats</Text>
              <div className="flex flex-wrap gap-2">
                <Badge color="green">JSON</Badge>
                <Badge color="green">CSV</Badge>
              </div>
              <Text className="text-xs text-ui-fg-muted mt-2">
                Filename must contain the table name (e.g., contact_submissions.json)
              </Text>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              multiple
              onChange={handleImport}
              className="hidden"
            />

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <ArrowUpTray className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Select Files to Import'}
            </Button>

            {importResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <Text className="text-sm font-medium text-ui-fg-base">Import Results</Text>
                {importResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border ${
                      result.errors.length > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result.errors.length > 0 && result.success === 0 ? (
                        <XMark className="w-4 h-4 text-red-600" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                      <Text className="text-sm font-medium">{result.table}</Text>
                    </div>
                    <Text className="text-xs text-ui-fg-muted">
                      {result.success} imported, {result.failed} failed
                    </Text>
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        {result.errors.slice(0, 3).map((error, i) => (
                          <Text key={i} className="text-xs text-red-600">
                            {error}
                          </Text>
                        ))}
                        {result.errors.length > 3 && (
                          <Text className="text-xs text-red-600">
                            ...and {result.errors.length - 3} more errors
                          </Text>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Info */}
      <div className="mt-8">
        <Text className="font-medium text-ui-fg-base mb-4">Available Tables</Text>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tables.map((table) => (
            <div
              key={table.key}
              className="bg-ui-bg-base rounded-lg border border-ui-border-base p-3 text-center"
            >
              <Text className="text-sm text-ui-fg-base">{table.name}</Text>
              <Text className="text-xs text-ui-fg-muted">{table.key}</Text>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
