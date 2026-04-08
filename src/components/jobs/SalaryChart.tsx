/**
 * SalaryChart — visualises salary ranges across job applications.
 *
 * Parses common salary formats like:
 *   "$90,000 - $120,000"
 *   "90k-120k"
 *   "£50,000"
 *   "100000"
 *
 * Shows a bar chart with midpoint salary per application, coloured by status.
 */
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { JobApplication } from "@/data/mockJobs";
import { DollarSign, TrendingUp } from "lucide-react";

/** Parse a salary string into a { low, high, mid } object (in thousands). Returns null if unparseable. */
function parseSalary(raw: string | undefined): { low: number; high: number; mid: number } | null {
  if (!raw?.trim()) return null;

  // Remove currency symbols, commas, spaces
  const cleaned = raw.replace(/[£€$₹¥,\s]/g, "").toLowerCase();

  // Handle "k" suffix
  const toNum = (s: string) => {
    const n = parseFloat(s.replace("k", ""));
    if (isNaN(n)) return null;
    return s.includes("k") ? n * 1000 : n;
  };

  // Range: "90000-120000" or "90k-120k"
  const rangeMatch = cleaned.match(/^([\d.]+k?)[–\-to]+([\d.]+k?)$/);
  if (rangeMatch) {
    const low = toNum(rangeMatch[1]);
    const high = toNum(rangeMatch[2]);
    if (low !== null && high !== null) {
      return { low, high, mid: Math.round((low + high) / 2) };
    }
  }

  // Single value: "95000" or "95k"
  const singleMatch = cleaned.match(/^([\d.]+k?)$/);
  if (singleMatch) {
    const v = toNum(singleMatch[1]);
    if (v !== null) return { low: v, high: v, mid: v };
  }

  return null;
}

const STATUS_COLORS: Record<string, string> = {
  offer: "#22c55e",
  interview: "#eab308",
  applied: "#6366f1",
  saved: "#94a3b8",
  rejected: "#ef4444",
};

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-[200px]">
      <p className="font-semibold text-gray-900 truncate">{d.company}</p>
      <p className="text-gray-500 truncate">{d.position}</p>
      <p className="mt-1">
        <span className="font-medium">Salary:</span>{" "}
        {d.raw}
      </p>
      {d.low !== d.high && (
        <p className="text-gray-400">
          Range: {formatCurrency(d.low)} – {formatCurrency(d.high)}
        </p>
      )}
    </div>
  );
};

interface SalaryChartProps {
  jobs: JobApplication[];
}

const SalaryChart = ({ jobs }: SalaryChartProps) => {
  const chartData = useMemo(() => {
    return jobs
      .filter((j) => j.salary?.trim())
      .map((j) => {
        const parsed = parseSalary(j.salary);
        if (!parsed) return null;
        return {
          id: j.id,
          company: j.company,
          position: j.position,
          status: j.status,
          raw: j.salary,
          low: parsed.low,
          high: parsed.high,
          mid: parsed.mid,
          label: j.company.length > 12 ? j.company.slice(0, 10) + "…" : j.company,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.mid - a!.mid)) as {
        id: string;
        company: string;
        position: string;
        status: string;
        raw: string;
        low: number;
        high: number;
        mid: number;
        label: string;
      }[];
  }, [jobs]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Salary Comparison</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            Add salary information to your applications to see a comparison here.
          </p>
        </div>
      </div>
    );
  }

  const average = Math.round(
    chartData.reduce((sum, d) => sum + d.mid, 0) / chartData.length
  );

  const stats = {
    min: Math.min(...chartData.map((d) => d.low)),
    max: Math.max(...chartData.map((d) => d.high)),
    avg: average,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Salary Comparison</h3>
        </div>
        <span className="text-xs text-gray-400">
          {chartData.length} application{chartData.length !== 1 ? "s" : ""} with salary data
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Lowest", value: stats.min, color: "text-red-600" },
          { label: "Average", value: stats.avg, color: "text-blue-600" },
          { label: "Highest", value: stats.max, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-md p-3 text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-base font-bold ${color}`}>
              {formatCurrency(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              angle={-20}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 10 }}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={average}
              stroke="#6366f1"
              strokeDasharray="4 2"
              label={{
                value: `Avg ${formatCurrency(average)}`,
                position: "right",
                fontSize: 10,
                fill: "#6366f1",
              }}
            />
            <Bar dataKey="mid" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1 text-xs text-gray-500">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalaryChart;
