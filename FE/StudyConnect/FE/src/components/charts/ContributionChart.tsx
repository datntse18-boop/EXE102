import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

const data = [
  { day: 'Mon', value: 2 },
  { day: 'Tue', value: 5 },
  { day: 'Wed', value: 3 },
  { day: 'Thu', value: 6 },
  { day: 'Fri', value: 4 },
  { day: 'Sat', value: 2 },
  { day: 'Sun', value: 1 },
]

export default function ContributionChart() {
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#FF6B00" fillOpacity={1} fill="url(#g)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
