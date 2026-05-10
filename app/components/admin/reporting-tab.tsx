'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { BarChart3, DollarSign, BookOpen, Zap, Lightbulb, RefreshCw, TrendingDown } from 'lucide-react';

type Period = 'week' | 'month' | 'quarter' | 'year';

interface ReportData {
  period: string;
  since: string;
  summary: {
    bookCount: number;
    completedBooks: number;
    totalCost: number;
    avgCostPerBook: number;
    totalCalls: number;
    totalCacheHits: number;
    cacheHitRate: number;
  };
  perBook: Array<{
    id: string; name: string; genre: string; wordCount: number; step: number;
    createdAt: string; user: string; cost: number; tokens: number; calls: number; cacheHits: number;
  }>;
  perModel: Array<{
    model: string; provider: string; calls: number; promptTokens: number;
    completionTokens: number; cost: number; cacheHits: number;
  }>;
  perTask: Array<{ task: string; calls: number; cost: number; tokens: number; cacheHits: number }>;
  recommendations: string[];
}

function money(n: number) {
  if (n < 0.01 && n > 0) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function ReportingTab() {
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports?period=${p}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const j = await res.json();
      setData(j);
    } catch (e: any) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(period); /* eslint-disable-next-line */ }, [period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-400" />
                Usage & Cost Reporting
              </CardTitle>
              <CardDescription className="text-gray-400">
                Historical book generation activity, estimated LLM costs, and optimization recommendations.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {(['week','month','quarter','year'] as Period[]).map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? 'default' : 'outline'}
                  className={period === p ? 'bg-teal-500 hover:bg-teal-600' : 'border-gray-600 text-gray-200 hover:bg-gray-700'}
                  onClick={() => setPeriod(p)}
                >
                  {p[0].toUpperCase() + p.slice(1)}
                </Button>
              ))}
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" onClick={() => fetchReport(period)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="pt-6 text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      )}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard icon={<BookOpen className="h-5 w-5 text-teal-400" />} label="Books Created" value={String(data.summary.bookCount)} sub={`${data.summary.completedBooks} completed`} />
            <SummaryCard icon={<DollarSign className="h-5 w-5 text-teal-400" />} label="Total Est. Cost" value={money(data.summary.totalCost)} sub={`${data.summary.totalCalls} calls`} />
            <SummaryCard icon={<TrendingDown className="h-5 w-5 text-teal-400" />} label="Avg / Book" value={money(data.summary.avgCostPerBook)} sub="Est. per book" />
            <SummaryCard icon={<Zap className="h-5 w-5 text-teal-400" />} label="Cache Hit Rate" value={`${(data.summary.cacheHitRate * 100).toFixed(1)}%`} sub={`${data.summary.totalCacheHits} hits`} />
          </div>

          {/* Recommendations */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                Cost-Efficiency Recommendations
              </CardTitle>
              <CardDescription className="text-gray-400">Insights based on your actual usage patterns in this period.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.recommendations.map((r, i) => (
                  <li key={i} className="text-gray-200 text-sm flex gap-2">
                    <span className="text-teal-400">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Per Model */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Per-Model Usage</CardTitle>
              <CardDescription className="text-gray-400">Token consumption and estimated cost grouped by LLM model.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.perModel.length === 0 ? (
                <p className="text-gray-400 text-sm">No usage logs yet for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 pr-2">Model</th>
                        <th className="text-left py-2 pr-2">Provider</th>
                        <th className="text-right py-2 pr-2">Calls</th>
                        <th className="text-right py-2 pr-2">Cache Hits</th>
                        <th className="text-right py-2 pr-2">Prompt Tokens</th>
                        <th className="text-right py-2 pr-2">Output Tokens</th>
                        <th className="text-right py-2">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.perModel.map(m => (
                        <tr key={m.model} className="text-gray-200 border-b border-gray-800">
                          <td className="py-2 pr-2 font-mono text-xs">{m.model}</td>
                          <td className="py-2 pr-2"><Badge variant="outline" className="border-gray-600 text-gray-300">{m.provider}</Badge></td>
                          <td className="text-right py-2 pr-2">{m.calls.toLocaleString()}</td>
                          <td className="text-right py-2 pr-2 text-teal-400">{m.cacheHits}</td>
                          <td className="text-right py-2 pr-2">{m.promptTokens.toLocaleString()}</td>
                          <td className="text-right py-2 pr-2">{m.completionTokens.toLocaleString()}</td>
                          <td className="text-right py-2 font-semibold">{money(m.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per Task */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Per-Task Type Usage</CardTitle>
              <CardDescription className="text-gray-400">Where the cost is going by stage of book generation.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.perTask.length === 0 ? (
                <p className="text-gray-400 text-sm">No usage logs yet for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 pr-2">Task</th>
                        <th className="text-right py-2 pr-2">Calls</th>
                        <th className="text-right py-2 pr-2">Cache Hits</th>
                        <th className="text-right py-2 pr-2">Tokens</th>
                        <th className="text-right py-2">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.perTask.map(t => (
                        <tr key={t.task} className="text-gray-200 border-b border-gray-800">
                          <td className="py-2 pr-2 font-mono text-xs">{t.task}</td>
                          <td className="text-right py-2 pr-2">{t.calls}</td>
                          <td className="text-right py-2 pr-2 text-teal-400">{t.cacheHits}</td>
                          <td className="text-right py-2 pr-2">{t.tokens.toLocaleString()}</td>
                          <td className="text-right py-2 font-semibold">{money(t.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per Book */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Per-Book Cost Breakdown</CardTitle>
              <CardDescription className="text-gray-400">Books created in this period and their LLM cost.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.perBook.length === 0 ? (
                <p className="text-gray-400 text-sm">No books created in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 pr-2">Book</th>
                        <th className="text-left py-2 pr-2">User</th>
                        <th className="text-left py-2 pr-2">Genre</th>
                        <th className="text-right py-2 pr-2">Step</th>
                        <th className="text-right py-2 pr-2">Words</th>
                        <th className="text-right py-2 pr-2">Calls</th>
                        <th className="text-right py-2">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.perBook.map(b => (
                        <tr key={b.id} className="text-gray-200 border-b border-gray-800">
                          <td className="py-2 pr-2 max-w-[240px] truncate" title={b.name}>{b.name}</td>
                          <td className="py-2 pr-2 text-xs">{b.user}</td>
                          <td className="py-2 pr-2">{b.genre}</td>
                          <td className="text-right py-2 pr-2">{b.step}/5</td>
                          <td className="text-right py-2 pr-2">{(b.wordCount || 0).toLocaleString()}</td>
                          <td className="text-right py-2 pr-2">{b.calls}</td>
                          <td className="text-right py-2 font-semibold">{money(b.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-gray-500">
            * Cost figures are estimates based on public model pricing and observed token usage. Actual provider invoices may vary.
          </p>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-gray-700/50">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
