import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllTests, deleteTest } from '../api';
import type { Test } from '../types';
import { useTestCreationStore } from '../store';

const STATUS_COLORS: Record<string, string> = {
  live: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  null: 'bg-gray-100 text-gray-500',
  undefined: 'bg-gray-100 text-gray-500',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { reset } = useTestCreationStore();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await getAllTests();
      setTests(res.data.data || []);
    } catch {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await deleteTest(id);
      toast.success('Test deleted');
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error('Failed to delete test');
    }
  };

  const filtered = tests.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: tests.length,
    live: tests.filter((t) => t.status === 'live').length,
    draft: tests.filter((t) => !t.status || t.status === 'draft').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your test library</p>
        </div>
        <button
          onClick={() => { reset(); navigate('/tests/create'); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Create New Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tests', value: stats.total, icon: FileText, color: 'text-blue-500 bg-blue-50' },
          { label: 'Live Tests', value: stats.live, icon: CheckCircle, color: 'text-green-500 bg-green-50' },
          { label: 'Drafts', value: stats.draft, icon: Clock, color: 'text-yellow-500 bg-yellow-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">All Tests</h2>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests..."
              className="input pl-9 py-2 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            Loading tests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No tests found</p>
            <button
              onClick={() => { reset(); navigate('/tests/create'); }}
              className="btn-primary mt-4"
            >
              Create your first test
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Test Name</th>
                <th className="px-4 py-3 text-left">Subject</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Questions</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((test, i) => (
                <tr key={test.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">{test.name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {typeof test.subject === 'object' ? (test.subject as any)?.name : test.subject || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{test.type || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.total_questions || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[test.status as string] || STATUS_COLORS['null']}`}>
                      {test.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {test.created_at ? new Date(test.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/tests/${test.id}/preview`)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                        title="View"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/tests/${test.id}/edit`)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
