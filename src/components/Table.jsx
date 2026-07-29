import React from 'react'

export default function Table({ columns, data }) {
  return (
    <div className="bg-card rounded border border-border shadow overflow-hidden text-text">
      <table className="w-full text-left">
        <thead className="bg-surface-secondary">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="p-3 font-semibold text-text-secondary text-sm  tracking-wider">{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-border hover:bg-surface-secondary/40 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="p-3 text-sm text-text">{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
