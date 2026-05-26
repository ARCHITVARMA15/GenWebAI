import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'
import { Globe, Rocket, Zap, CalendarDays } from 'lucide-react'
import { serverUrl } from '../App'

const COLORS = ['#6366f1', '#27272a']

const fmt = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function StatCard({ icon, value, label, sub, loading }) {
    if (loading) return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse space-y-3">
            <div className="h-4 w-8 bg-white/10 rounded" />
            <div className="h-8 w-16 bg-white/10 rounded" />
            <div className="h-3 w-24 bg-white/10 rounded" />
        </div>
    )
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-2">
            <span className="text-zinc-400">{icon}</span>
            <span className="text-3xl font-bold">{value ?? '—'}</span>
            <span className="text-sm text-zinc-400">{label}</span>
            {sub && <span className="text-xs text-zinc-600">{sub}</span>}
        </div>
    )
}

function SkeletonBlock({ h = 'h-48' }) {
    return <div className={`${h} rounded-2xl bg-white/5 border border-white/10 animate-pulse`} />
}

function AnalyticsDashboard() {
    const [overview, setOverview] = useState(null)
    const [activity, setActivity] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)
            try {
                const [ovRes, actRes, stRes] = await Promise.all([
                    axios.get(`${serverUrl}/api/analytics/overview`, { withCredentials: true }),
                    axios.get(`${serverUrl}/api/analytics/activity?days=30`, { withCredentials: true }),
                    axios.get(`${serverUrl}/api/analytics/websites/stats`, { withCredentials: true })
                ])
                setOverview(ovRes.data.data)
                setActivity(actRes.data.data)
                setStats(stRes.data.data)
            } catch {
                setError('Could not load analytics. Please refresh.')
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    if (error) return (
        <div className="mt-24 text-center text-red-400">{error}</div>
    )

    const pieData = stats
        ? [
            { name: 'Deployed', value: stats.deployed },
            { name: 'Drafts', value: stats.drafts }
          ]
        : []

    const planColors = { free: 'text-zinc-400', pro: 'text-indigo-400', enterprise: 'text-purple-400' }
    const planLabel = { free: 'Free Plan', pro: 'Pro Plan', enterprise: 'Enterprise' }

    const visibleActivity = activity.filter((_, i) => i % 3 === 0 || i === activity.length - 1)

    return (
        <div className="space-y-6 pb-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    loading={loading}
                    icon={<Globe size={18} />}
                    value={overview?.totalWebsitesCreated}
                    label="Total Sites"
                    sub={overview?.mostRecentActivity ? `Last active ${new Date(overview.mostRecentActivity).toLocaleDateString()}` : undefined}
                />
                <StatCard
                    loading={loading}
                    icon={<Rocket size={18} />}
                    value={overview?.totalDeployments}
                    label="Deployed"
                    sub={stats ? `${stats.drafts} draft${stats.drafts !== 1 ? 's' : ''}` : undefined}
                />
                <StatCard
                    loading={loading}
                    icon={<Zap size={18} />}
                    value={overview?.creditsRemaining}
                    label="Credits Left"
                    sub={overview?.plan ? planLabel[overview.plan] : undefined}
                />
                <StatCard
                    loading={loading}
                    icon={<CalendarDays size={18} />}
                    value={overview?.websitesThisMonth}
                    label="This Month"
                    sub="websites generated"
                />
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <h3 className="text-sm font-semibold mb-4 text-zinc-300">Websites Generated — Last 30 Days</h3>
                {loading ? (
                    <SkeletonBlock h="h-48" />
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={activity} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                            <XAxis
                                dataKey="date"
                                tickFormatter={fmt}
                                ticks={visibleActivity.map(d => d.date)}
                                tick={{ fill: '#71717a', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: '#71717a', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px' }}
                                labelStyle={{ color: '#a1a1aa' }}
                                itemStyle={{ color: '#ffffff' }}
                                labelFormatter={fmt}
                                formatter={(v) => [v, 'Sites']}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#6366f1"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#6366f1' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <h3 className="text-sm font-semibold mb-4 text-zinc-300">Deployed vs Drafts</h3>
                    {loading || !stats ? (
                        <SkeletonBlock h="h-40" />
                    ) : stats.deployed + stats.drafts === 0 ? (
                        <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">No websites yet</div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width={140} height={140}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0" />
                                    <span className="text-zinc-300">Deployed</span>
                                    <span className="ml-auto font-bold">{stats.deployed}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-zinc-700 flex-shrink-0" />
                                    <span className="text-zinc-300">Drafts</span>
                                    <span className="ml-auto font-bold">{stats.drafts}</span>
                                </div>
                                {stats.averageGenerationLength > 0 && (
                                    <p className="text-xs text-zinc-600 pt-2 border-t border-white/10">
                                        Avg size: {(stats.averageGenerationLength / 1000).toFixed(1)}k chars
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-zinc-300">Account Health</h3>
                    {loading ? (
                        <SkeletonBlock h="h-32" />
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Plan</span>
                                <span className={`text-sm font-semibold capitalize ${planColors[overview?.plan] || 'text-zinc-400'}`}>
                                    {planLabel[overview?.plan] || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Credits</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all"
                                            style={{ width: `${Math.min((overview?.creditsRemaining / 500) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold">{overview?.creditsRemaining}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Member Since</span>
                                <span className="text-sm text-zinc-300">
                                    {overview?.memberSince ? new Date(overview.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                                </span>
                            </div>
                            {overview?.topGeneratedCategories?.length > 0 && (
                                <div className="pt-3 border-t border-white/10">
                                    <p className="text-xs text-zinc-500 mb-2">Top keywords in your sites</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {overview.topGeneratedCategories.map(c => (
                                            <span key={c.name} className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AnalyticsDashboard
