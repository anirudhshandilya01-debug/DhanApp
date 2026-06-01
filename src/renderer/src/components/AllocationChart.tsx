import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { AllocationSlice } from '../../../shared/types'
import { inr, sectorColor } from '../util'

interface Props {
  bySector: AllocationSlice[]
}

export default function AllocationChart({ bySector }: Props): JSX.Element {
  if (bySector.length === 0) {
    return (
      <div className="empty" style={{ padding: '20px 10px' }}>
        Sector allocation will appear once you add holdings.
      </div>
    )
  }

  const data = bySector.map((s) => ({
    name: s.label,
    value: Math.round(s.investedInr),
    pct: s.pct
  }))

  return (
    <div className="chart-wrap">
      <div style={{ width: 168, height: 168, flexShrink: 0 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={sectorColor(d.name)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => inr(v)}
              contentStyle={{
                background: '#1c1815',
                border: '1px solid #34291f',
                borderRadius: 8,
                fontSize: 12,
                color: '#f3ece2'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {bySector.map((s) => (
          <div className="legend-item" key={s.key}>
            <span className="sw" style={{ background: sectorColor(s.label) }} />
            <span className="lbl">{s.label}</span>
            <span className="v">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
