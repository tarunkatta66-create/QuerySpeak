import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export type ChartType = 'line' | 'pie' | 'bar';

export function suggestChartType(
  columns: string[],
  rows: Array<Record<string, unknown>>
): ChartType {
  if (!columns.length || !rows.length) return 'bar';

  // Check if any column contains date/time keywords or values
  const hasDateCol = columns.some((col) => {
    const name = col.toLowerCase();
    return (
      name.includes('date') ||
      name.includes('month') ||
      name.includes('year') ||
      name.includes('time') ||
      name.includes('created')
    );
  });
  if (hasDateCol) return 'line';

  // Check for low-cardinality category column (<= 8 unique values)
  for (const col of columns) {
    const uniqueVals = new Set(rows.map((r) => String(r[col])));
    if (uniqueVals.size > 1 && uniqueVals.size <= 8) {
      // If there's a numeric column to aggregate against
      const hasNumericCol = columns.some((c) => c !== col);
      if (hasNumericCol) return 'pie';
    }
  }

  return 'bar';
}

interface ChartRendererProps {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  height?: number;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  columns,
  rows,
  height = 240,
}) => {
  if (!columns.length || !rows.length) return null;

  const chartType = suggestChartType(columns, rows);

  // Label column is first column or first non-numeric
  const labelCol = columns[0];
  const valueCol = columns.find((c) => c !== labelCol) || columns[0];

  const labels = rows.map((r) => String(r[labelCol] ?? ''));
  const rawValues = rows.map((r) => {
    const val = r[valueCol];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  });

  const palette = ['#FF6B4A', '#16A394', '#2E8B57', '#6B6456', '#14213D'];

  const chartData = {
    labels,
    datasets: [
      {
        label: valueCol,
        data: rawValues,
        backgroundColor:
          chartType === 'pie'
            ? palette.slice(0, labels.length)
            : 'rgba(22, 163, 148, 0.75)',
        borderColor: chartType === 'pie' ? '#FFFFFF' : '#16A394',
        borderWidth: 2,
        borderRadius: chartType === 'bar' ? 6 : 0,
        tension: 0.3,
        fill: chartType === 'line',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType === 'pie',
        position: 'top' as const,
        labels: {
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#14213D',
        titleFont: { family: 'Inter', size: 13, weight: 'bold' as const },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales:
      chartType === 'pie'
        ? undefined
        : {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Inter', size: 11 } },
            },
            y: {
              grid: { color: 'rgba(234, 227, 211, 0.5)' },
              ticks: { font: { family: 'Inter', size: 11 } },
            },
          },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ height }}
      className="w-full relative"
    >
      {chartType === 'line' && <Line data={chartData} options={options} />}
      {chartType === 'pie' && <Pie data={chartData} options={options} />}
      {chartType === 'bar' && <Bar data={chartData} options={options} />}
    </motion.div>
  );
};
