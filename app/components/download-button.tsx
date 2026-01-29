'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Text, Input } from '@medusajs/ui'
import { ArrowDownTray } from '@medusajs/icons'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DownloadButtonProps {
  tableName: string
  title: string
  isVault?: boolean
}

type DownloadFormat = 'excel' | 'pdf' | 'csv' | 'json' | 'txt'
type DateOption = 'recent60' | 'dateRange' | 'all'

const formatLabels: Record<DownloadFormat, string> = {
  excel: 'Excel (.xlsx)',
  pdf: 'PDF',
  csv: 'CSV',
  json: 'JSON',
  txt: 'Text (.txt)',
}

export function DownloadButton({ tableName, title, isVault = false }: DownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateOption, setDateOption] = useState<DateOption>('recent60')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    let url = `/api/submissions?table=${tableName}`
    if (isVault) {
      url += '&vaulted=true'
    }

    const response = await fetch(url)
    const result = await response.json()
    let data = result.data || []

    // Apply date filtering
    if (dateOption === 'recent60') {
      data = data.slice(0, 60)
    } else if (dateOption === 'dateRange' && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      data = data.filter((item: Record<string, unknown>) => {
        const itemDate = new Date(item.created_at as string)
        return itemDate >= start && itemDate <= end
      })
    }

    return data
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

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const downloadExcel = async () => {
    const data = await fetchData()
    const formatted = formatDataForExport(data)

    const ws = XLSX.utils.json_to_sheet(formatted)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title)

    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const downloadPDF = async () => {
    const data = await fetchData()
    const formatted = formatDataForExport(data)

    if (formatted.length === 0) {
      alert('No data to export')
      return
    }

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

    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(fileName)
  }

  const downloadCSV = async () => {
    const data = await fetchData()
    const formatted = formatDataForExport(data)

    if (formatted.length === 0) {
      alert('No data to export')
      return
    }

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

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    downloadBlob(url, fileName)
  }

  const downloadJSON = async () => {
    const data = await fetchData()

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.json`
    downloadBlob(url, fileName)
  }

  const downloadTXT = async () => {
    const data = await fetchData()
    const formatted = formatDataForExport(data)

    if (formatted.length === 0) {
      alert('No data to export')
      return
    }

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

    const blob = new Blob([txtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`
    downloadBlob(url, fileName)
  }

  const downloadBlob = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownload = async (downloadFormat: DownloadFormat) => {
    setIsDownloading(true)
    try {
      switch (downloadFormat) {
        case 'excel':
          await downloadExcel()
          break
        case 'pdf':
          await downloadPDF()
          break
        case 'csv':
          await downloadCSV()
          break
        case 'json':
          await downloadJSON()
          break
        case 'txt':
          await downloadTXT()
          break
      }
      setIsOpen(false)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="small"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDownloading}
      >
        <ArrowDownTray className="w-4 h-4 mr-2" />
        {isDownloading ? 'Downloading...' : 'Download'}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg overflow-hidden z-50">
          {/* Date Options */}
          <div className="p-3 border-b border-ui-border-base">
            <Text className="text-xs text-ui-fg-muted font-medium mb-2">Select Range</Text>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateOption"
                  checked={dateOption === 'recent60'}
                  onChange={() => setDateOption('recent60')}
                  className="w-4 h-4"
                />
                <Text className="text-sm">60 Most Recent</Text>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateOption"
                  checked={dateOption === 'all'}
                  onChange={() => setDateOption('all')}
                  className="w-4 h-4"
                />
                <Text className="text-sm">All Records</Text>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateOption"
                  checked={dateOption === 'dateRange'}
                  onChange={() => setDateOption('dateRange')}
                  className="w-4 h-4"
                />
                <Text className="text-sm">Date Range</Text>
              </label>

              {dateOption === 'dateRange' && (
                <div className="pl-6 space-y-2 mt-2">
                  <div>
                    <Text className="text-xs text-ui-fg-muted mb-1">From</Text>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Text className="text-xs text-ui-fg-muted mb-1">To</Text>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Format Options */}
          <div className="p-2">
            <Text className="text-xs text-ui-fg-muted font-medium px-2 mb-1">Download As</Text>
            {(Object.keys(formatLabels) as DownloadFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleDownload(fmt)}
                disabled={isDownloading || (dateOption === 'dateRange' && (!startDate || !endDate))}
                className="w-full px-3 py-2 text-left text-sm text-ui-fg-base hover:bg-ui-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {formatLabels[fmt]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
