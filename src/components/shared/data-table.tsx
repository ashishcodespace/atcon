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
};

export function DataTable<T>({ columns, rows, className, emptyMessage = "No data." }: DataTableProps<T>) {
  return (
    <div className={clsx("overflow-hidden rounded-xl border border-slate-200", className)}>
      <table className="w-full text-left">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={clsx("px-3 py-2 text-xs font-semibold text-slate-500", column.className)}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-sm text-slate-500" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100 text-sm text-slate-700">
                {columns.map((column) => (
                  <td key={column.key} className={clsx("px-3 py-2 align-middle", column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
