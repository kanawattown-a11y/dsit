"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ChartProps {
    usersChart: { name: string, count: number }[];
    centersChart: { name: string, count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminCharts({ usersChart, centersChart }: ChartProps) {
    return (
        <div className="grid grid-2 mb-8" style={{ gap: "var(--space-6)" }}>
            
            {/* Pie Chart for Users */}
            <div className="card animate-slide-up" style={{ display: "flex", flexDirection: "column" }}>
                <div className="card-header">
                    <h2 className="card-title">توزيع المستخدمين حسب الرتبة</h2>
                </div>
                <div style={{ padding: "var(--space-4)", height: "300px", flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={usersChart}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {usersChart.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, "العدد"]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bar Chart for Centers */}
            <div className="card animate-slide-up" style={{ display: "flex", flexDirection: "column" }}>
                <div className="card-header">
                    <h2 className="card-title">توزيع المراكز المعتمدة</h2>
                </div>
                <div style={{ padding: "var(--space-4)", height: "300px", flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={centersChart}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            barSize={40}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: 'var(--navy-800)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--navy-800)', fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'var(--gray-100)' }} formatter={(value) => [value, "العدد"]} />
                            <Bar dataKey="count" fill="var(--success)" radius={[4, 4, 0, 0]}>
                                {centersChart.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
