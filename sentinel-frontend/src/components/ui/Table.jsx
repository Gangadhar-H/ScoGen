import React from 'react'
import { Shield } from 'lucide-react'

export function Table({ columns, data, loading, empty = 'No data found', onRowClick }) {
  if (loading) {
    return (
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="table-header text-left" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-dark-border/20">
                {columns.map((col) => (
                  <td key={col.key} className="table-cell">
                    <div className="h-4 bg-white/5 rounded-lg animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="table-header text-left" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="py-20 text-center animate-fade-in">
          <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
            <Shield size={32} className="text-dark-text/10" />
          </div>
          <p className="text-sm text-dark-text/30 font-medium tracking-tight">{empty}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-header text-left" style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="table-cell">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}