import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProgressData } from '../../../types/teacher';

export function ProgressChart({ data }: { data: ProgressData[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="schoolProgress"
            name="学校の進度"
            stroke="#2a78d6"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="studentProgress"
            name="個人の進度"
            stroke="#eb6834"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-gray-400">
        ※ 過去の推移は現時点のデータからの近似表示です(月次の履歴データは未保存のため)。
      </p>
    </div>
  );
}
