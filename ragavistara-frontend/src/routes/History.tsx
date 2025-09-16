import { useEffect, useMemo, useState } from 'react'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

type Row = { id: string; filename: string; date: string; duration: number; topRaga: string; confidence: number }

export default function History() {
  const [rows, setRows] = useState<Row[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get<{ items: Row[]; total: number }>('/history?page=1&pageSize=10').then((r) => setRows(r.data.items))
  }, [])

  const columnHelper = createColumnHelper<Row>()
  const columns = useMemo(
    () => [
      columnHelper.accessor('filename', { header: 'File' }),
      columnHelper.accessor('date', { header: 'Date', cell: (info) => new Date(info.getValue()).toLocaleString() }),
      columnHelper.accessor('duration', { header: 'Dur (s)' }),
      columnHelper.accessor('topRaga', { header: 'Top Raga' }),
      columnHelper.accessor('confidence', { header: 'Conf', cell: (info) => `${Math.round(info.getValue() * 100)}%` }),
      columnHelper.accessor('id', {
        header: 'Actions',
        cell: (info) => (
          <button className="text-xs underline" onClick={() => navigate(`/compare?id=${info.getValue()}`)}>Compare</button>
        ),
      }),
    ],
    [columnHelper, navigate],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-2xl font-semibold mb-4">History</h2>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left px-4 py-2 font-medium">
                    {h.isPlaceholder ? null : h.column.columnDef.header as string}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="px-4 py-2 text-neutral-300">{c.renderCell()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


