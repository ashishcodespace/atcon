import { ReactNode } from "react";
import clsx from "clsx";

type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  className?: string;
  emptyMessage?: string;
  minWidth?: string;
};

export function DataTable<T>({ 
  columns, 
  rows, 
  className, 
  emptyMessage = "No data.",
  minWidth = "800px" 
}: DataTableProps<T>) {
  return (
    <div className={clsx("rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" style={{ minWidth }}>
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={clsx("px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400", column.className)}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {rows.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-sm text-slate-500 text-center" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className={clsx("px-6 py-4 align-middle", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
