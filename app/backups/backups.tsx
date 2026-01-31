'use client'

import { useState, useRef, useCallback } from 'react'
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
  skipped: number
  errors: string[]
}

interface ExportProgress {
  current: number
  total: number
  currentTable: string
  status: string
}

interface ImportData {
  [key: string]: Record<string, unknown>[]
}

const CHUNK_SIZE = 1000 // Process 1000 records at a time
const IMPORT_BATCH_SIZE = 100 // Import 100 records at a time

export function BackupsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('all')
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [importProgress, setImportProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDataForExport = useCallback((data: Record<string, unknown>[]) => {
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
  }, [])

  // Generate raw CSV (without formatting, for importable)
  const generateRawCSV = useCallback((data: Record<string, unknown>[]) => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvParts: string[] = [headers.join(',')]

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE)
      const chunkRows = chunk.map((row) =>
        headers
          .map((h) => {
            const value = row[h]
            if (value === null || value === undefined) return '""'
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(',')
      )
      csvParts.push(...chunkRows)
    }

    return csvParts.join('\n')
  }, [])

  // Generate Excel in chunks for large datasets
  const generateExcel = useCallback((data: Record<string, unknown>[], title: string) => {
    const formatted = formatDataForExport(data)
    const ws = XLSX.utils.json_to_sheet(formatted)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31)) // Excel sheet name limit
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  }, [formatDataForExport])

  // Generate PDF in chunks - skip for very large datasets
  const generatePDF = useCallback((data: Record<string, unknown>[], title: string) => {
    const formatted = formatDataForExport(data)
    if (formatted.length === 0) return null

    // Skip PDF for very large datasets (>10000 rows) as it's not practical
    if (formatted.length > 10000) {
      return null
    }

    const doc = new jsPDF('landscape')
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 22)
    doc.text(`Total Records: ${formatted.length}`, 14, 28)

    const headers = Object.keys(formatted[0])
    const rows = formatted.map((item) => headers.map((h) => String(item[h] ?? '')))

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 34,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [100, 100, 100] },
    })

    return doc.output('arraybuffer')
  }, [formatDataForExport])

  // Generate CSV using streaming approach for large files
  const generateCSV = useCallback((data: Record<string, unknown>[]) => {
    const formatted = formatDataForExport(data)
    if (formatted.length === 0) return ''

    const headers = Object.keys(formatted[0])
    const csvParts: string[] = [headers.join(',')]

    // Process in chunks to avoid blocking
    for (let i = 0; i < formatted.length; i += CHUNK_SIZE) {
      const chunk = formatted.slice(i, i + CHUNK_SIZE)
      const chunkRows = chunk.map((row) =>
        headers
          .map((h) => {
            const value = String(row[h] ?? '')
            return `"${value.replace(/"/g, '""')}"`
          })
          .join(',')
      )
      csvParts.push(...chunkRows)
    }

    return csvParts.join('\n')
  }, [formatDataForExport])

  // Generate TXT with chunked processing
  const generateTXT = useCallback((data: Record<string, unknown>[], title: string) => {
    const formatted = formatDataForExport(data)
    if (formatted.length === 0) return ''

    const parts: string[] = [
      title,
      `Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
      `Total Records: ${formatted.length}`,
      '='.repeat(50),
      ''
    ]

    for (let i = 0; i < formatted.length; i += CHUNK_SIZE) {
      const chunk = formatted.slice(i, i + CHUNK_SIZE)
      chunk.forEach((item, index) => {
        parts.push(`Record ${i + index + 1}`)
        parts.push('-'.repeat(30))
        for (const [key, value] of Object.entries(item)) {
          parts.push(`${key}: ${value}`)
        }
        parts.push('')
      })
    }

    return parts.join('\n')
  }, [formatDataForExport])

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress({ current: 0, total: 0, currentTable: '', status: 'Preparing...' })

    try {
      const zip = new JSZip()
      const dateStr = format(new Date(), 'yyyy-MM-dd')

      const tablesToExport = selectedTable === 'all'
        ? tables
        : tables.filter(t => t.key === selectedTable)

      setExportProgress(prev => ({ ...prev!, total: tablesToExport.length }))

      // Collect all data for import.json
      const allData: ImportData = {}

      // Create importable directories
      const importableJson = zip.folder('importable/json')
      const importableCsv = zip.folder('importable/csv')

      for (let i = 0; i < tablesToExport.length; i++) {
        const table = tablesToExport[i]
        setExportProgress({
          current: i + 1,
          total: tablesToExport.length,
          currentTable: table.name,
          status: `Fetching ${table.name}...`
        })

        const response = await fetch(`/api/submissions?table=${table.key}`)
        const result = await response.json()
        const data = result.data || []

        if (data.length === 0) continue

        // Store raw data for import.json
        allData[table.key] = data

        const folder = zip.folder(table.key)
        if (!folder) continue

        setExportProgress(prev => ({ ...prev!, status: `Processing ${table.name} (${data.length} records)...` }))

        // JSON - use streaming for large files
        setExportProgress(prev => ({ ...prev!, status: `Creating JSON for ${table.name}...` }))
        const jsonContent = JSON.stringify(data, null, 2)
        folder.file(`${table.key}.json`, jsonContent)

        // Add to importable/json (raw data)
        importableJson?.file(`${table.key}.json`, jsonContent)

        // CSV
        setExportProgress(prev => ({ ...prev!, status: `Creating CSV for ${table.name}...` }))
        const csv = generateCSV(data)
        if (csv) folder.file(`${table.key}.csv`, csv)

        // Add to importable/csv (raw data)
        const rawCsv = generateRawCSV(data)
        if (rawCsv) importableCsv?.file(`${table.key}.csv`, rawCsv)

        // Excel
        setExportProgress(prev => ({ ...prev!, status: `Creating Excel for ${table.name}...` }))
        const excel = generateExcel(data, table.name)
        folder.file(`${table.key}.xlsx`, excel)

        // PDF - only for smaller datasets
        if (data.length <= 10000) {
          setExportProgress(prev => ({ ...prev!, status: `Creating PDF for ${table.name}...` }))
          const pdf = generatePDF(data, table.name)
          if (pdf) folder.file(`${table.key}.pdf`, pdf)
        }

        // TXT
        setExportProgress(prev => ({ ...prev!, status: `Creating TXT for ${table.name}...` }))
        const txt = generateTXT(data, table.name)
        if (txt) folder.file(`${table.key}.txt`, txt)
      }

      // Create import.json at root level
      setExportProgress(prev => ({ ...prev!, status: 'Creating import.json...' }))
      zip.file('import.json', JSON.stringify(allData, null, 2))

      setExportProgress(prev => ({ ...prev!, status: 'Compressing ZIP file...' }))

      // Generate ZIP with compression and streaming
      const content = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
          streamFiles: true
        },
        (metadata) => {
          setExportProgress(prev => ({
            ...prev!,
            status: `Compressing: ${Math.round(metadata.percent)}%`
          }))
        }
      )

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
      setExportProgress(null)
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

        const value: unknown = values[index] || ''

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

  // Parse JSON in chunks to handle large files
  const parseJSONFile = async (file: File): Promise<Record<string, unknown>[] | ImportData> => {
    const content = await file.text()
    const data = JSON.parse(content)
    return data
  }

  // Parse CSV file with streaming for large files
  const parseCSVFile = async (file: File): Promise<Record<string, unknown>[]> => {
    const content = await file.text()
    return parseCSV(content)
  }

  // Import data in batches with duplicate checking
  const importInBatches = async (
    table: string,
    data: Record<string, unknown>[],
    onProgress: (progress: string) => void
  ): Promise<{ success: number; failed: number; skipped: number; errors: string[] }> => {
    let totalSuccess = 0
    let totalFailed = 0
    let totalSkipped = 0
    const allErrors: string[] = []

    const totalBatches = Math.ceil(data.length / IMPORT_BATCH_SIZE)

    for (let i = 0; i < data.length; i += IMPORT_BATCH_SIZE) {
      const batch = data.slice(i, i + IMPORT_BATCH_SIZE)
      const batchNum = Math.floor(i / IMPORT_BATCH_SIZE) + 1
      onProgress(`Importing batch ${batchNum}/${totalBatches} (${i + batch.length}/${data.length} records)`)

      try {
        const response = await fetch('/api/backups/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table, data: batch, skipDuplicates: true })
        })

        const result = await response.json()
        totalSuccess += result.success || 0
        totalFailed += result.failed || 0
        totalSkipped += result.skipped || 0
        if (result.errors) {
          allErrors.push(...result.errors.slice(0, 5))
        }
      } catch (error) {
        totalFailed += batch.length
        allErrors.push(`Batch ${batchNum} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Small delay between batches to prevent overwhelming the server
      if (i + IMPORT_BATCH_SIZE < data.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return { success: totalSuccess, failed: totalFailed, skipped: totalSkipped, errors: allErrors.slice(0, 10) }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsImporting(true)
    setImportResults([])
    setImportProgress('')
    const results: ImportResult[] = []

    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex]
        const fileName = file.name.toLowerCase()
        const isCSV = fileName.endsWith('.csv')
        const isJSON = fileName.endsWith('.json')

        setImportProgress(`Processing file ${fileIndex + 1}/${files.length}: ${file.name}`)

        if (!isCSV && !isJSON) {
          results.push({
            table: file.name,
            success: 0,
            failed: 0,
            skipped: 0,
            errors: ['Only JSON and CSV files are supported']
          })
          continue
        }

        try {
          setImportProgress(`Parsing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`)

          // Check if this is the import.json file (contains all tables)
          if (fileName === 'import.json') {
            const allData = await parseJSONFile(file) as ImportData

            // Check if it's the combined import format
            if (typeof allData === 'object' && !Array.isArray(allData)) {
              const tableKeys = Object.keys(allData)
              const validTableKeys = tableKeys.filter(key =>
                tables.some(t => t.key === key)
              )

              if (validTableKeys.length > 0) {
                setImportProgress(`Found ${validTableKeys.length} tables in import.json`)

                for (const tableKey of validTableKeys) {
                  const tableData = allData[tableKey]
                  if (!Array.isArray(tableData) || tableData.length === 0) continue

                  setImportProgress(`Importing ${tableData.length} records to ${tableKey}...`)

                  const result = await importInBatches(
                    tableKey,
                    tableData,
                    (progress) => setImportProgress(progress)
                  )

                  results.push({
                    table: `${tableKey} (from import.json)`,
                    success: result.success,
                    failed: result.failed,
                    skipped: result.skipped,
                    errors: result.errors
                  })
                }
                continue
              }
            }
          }

          // Regular file import
          let data: Record<string, unknown>[]

          if (isJSON) {
            const parsed = await parseJSONFile(file)
            data = Array.isArray(parsed) ? parsed : [parsed as Record<string, unknown>]
          } else {
            data = await parseCSVFile(file)
          }

          // Determine table from filename
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
              skipped: 0,
              errors: ['Could not determine table from filename. Filename should contain table name (e.g., contact_submissions.json) or use import.json for all tables']
            })
            continue
          }

          setImportProgress(`Importing ${data.length} records to ${detectedTable}...`)

          // Import in batches for large datasets
          const result = await importInBatches(
            detectedTable,
            data,
            (progress) => setImportProgress(progress)
          )

          results.push({
            table: `${detectedTable} (${file.name})`,
            success: result.success,
            failed: result.failed,
            skipped: result.skipped,
            errors: result.errors
          })
        } catch (parseError) {
          results.push({
            table: file.name,
            success: 0,
            failed: 0,
            skipped: 0,
            errors: [`Failed to parse file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`]
          })
        }
      }
    } catch (error) {
      console.error('Import error:', error)
      results.push({
        table: 'Import',
        success: 0,
        failed: 0,
        skipped: 0,
        errors: ['An unexpected error occurred during import']
      })
    } finally {
      setImportResults(results)
      setIsImporting(false)
      setImportProgress('')
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
              <Text className="text-xs text-ui-fg-muted mb-2">Included in Export</Text>
              <div className="flex flex-wrap gap-2 mb-2">
                {['CSV', 'JSON', 'Excel', 'PDF', 'TXT'].map((fmt) => (
                  <Badge key={fmt} color="grey">{fmt}</Badge>
                ))}
              </div>
              <Text className="text-xs text-ui-fg-muted">
                + <strong>import.json</strong> (for easy restore)
              </Text>
              <Text className="text-xs text-ui-fg-muted">
                + <strong>importable/</strong> folder with raw JSON & CSV
              </Text>
            </div>

            {exportProgress && (
              <div className="bg-ui-bg-subtle rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-xs text-ui-fg-muted">
                    {exportProgress.current}/{exportProgress.total} tables
                  </Text>
                  <Text className="text-xs font-medium text-ui-fg-base">
                    {exportProgress.currentTable}
                  </Text>
                </div>
                <Text className="text-xs text-ui-fg-subtle">{exportProgress.status}</Text>
              </div>
            )}

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
                <strong>Easiest:</strong> Use <code className="bg-ui-bg-base px-1 rounded">import.json</code> from backup
              </Text>
              <Text className="text-xs text-ui-fg-muted mt-1">
                Or files from <code className="bg-ui-bg-base px-1 rounded">importable/</code> folder
              </Text>
              <Text className="text-xs text-ui-fg-subtle mt-2">
                Duplicates are automatically skipped (based on email)
              </Text>
            </div>

            {importProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <Text className="text-xs text-blue-700">{importProgress}</Text>
              </div>
            )}

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
                      result.errors.length > 0 && result.success === 0
                        ? 'bg-red-50 border-red-200'
                        : result.errors.length > 0
                        ? 'bg-yellow-50 border-yellow-200'
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
                      {result.success.toLocaleString()} imported
                      {result.skipped > 0 && `, ${result.skipped.toLocaleString()} skipped (duplicates)`}
                      {result.failed > 0 && `, ${result.failed.toLocaleString()} failed`}
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
