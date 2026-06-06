import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, CheckCircle, Clock, BookOpen, Target, ChevronRight, Calendar, X } from 'lucide-react';
import { getTestById, updateTest, fetchBulkQuestions } from '../api';
import { useTestCreationStore } from '../store';

function PublishModal({ testId, onClose, onSuccess }: { testId: string; onClose: () => void; onSuccess: () => void }) {
  const [tab, setTab] = useState<'now' | 'schedule'>('now');
  const [liveUntil, setLiveUntil] = useState('always');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);

  const DURATION_OPTIONS = [
    { value: 'always', label: 'Always Available' },
    { value: '1_week', label: '1 Week' },
    { value: '2_weeks', label: '2 Weeks' },
    { value: '3_weeks', label: '3 Weeks' },
    { value: '1_month', label: '1 Month' },
    { value: 'custom', label: 'Custom Duration' },
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await updateTest(testId, { status: 'live' });
      toast.success('Test published successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Publish Test</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-100 pb-1">
            <button
              onClick={() => setTab('now')}
              className={`text-sm font-medium pb-2 border-b-2 -mb-1 transition-colors ${tab === 'now' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
            >
              Publish Now
            </button>
            <button
              onClick={() => setTab('schedule')}
              className={`text-sm font-medium pb-2 border-b-2 -mb-1 transition-colors ${tab === 'schedule' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
            >
              Schedule Publish
            </button>
          </div>

          {tab === 'schedule' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Select Date and Time</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="input pr-9" />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="input" />
              </div>
            </div>
          )}

          {/* Live Until */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Live Until</h4>
            <p className="text-xs text-gray-500 mb-3">Choose how long this test should remain available on the platform.</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setLiveUntil(value)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${liveUntil === value ? 'border-primary' : 'border-gray-300'}`}
                  >
                    {liveUntil === value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {liveUntil === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="Select End Date" className="input pr-9" />
                <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="Select End Time" className="input" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className="btn-primary px-8">
            {loading ? 'Publishing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PreviewPublishPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { questions } = useTestCreationStore();

  const [test, setTest] = useState<any>(null);
  const [loadedQuestions, setLoadedQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublish, setShowPublish] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (id) {
      getTestById(id).then(async r => {
        const t = r.data.data;
        setTest(t);
        if (t.status === 'live') setPublished(true);

        // Load questions
        const qIds = t.questions || [];
        if (qIds.length > 0) {
          try {
            const qRes = await fetchBulkQuestions(qIds);
            setLoadedQuestions(qRes.data.data || []);
          } catch { setLoadedQuestions(questions); }
        } else {
          setLoadedQuestions(questions);
        }
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const displayedQuestions = loadedQuestions.length > 0 ? loadedQuestions : questions;

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Test Creation</span>
        <ChevronRight size={14} />
        <span className="text-primary font-medium">Preview & Publish</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Test Preview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review before publishing</p>
        </div>
        <div className="flex items-center gap-3">
          {!published && (
            <button onClick={() => navigate(`/tests/${id}/questions`)} className="btn-secondary flex items-center gap-2">
              <Pencil size={14} />
              Edit Questions
            </button>
          )}
          {published ? (
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium text-sm">
              <CheckCircle size={16} />
              Published
            </div>
          ) : (
            <button onClick={() => setShowPublish(true)} className="btn-primary flex items-center gap-2">
              <CheckCircle size={16} />
              Publish Test
            </button>
          )}
        </div>
      </div>

      {/* Test Summary Card */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-full font-medium capitalize">
                {test?.type?.replace('_', ' ') || 'Chapter Wise'}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                test?.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                test?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>{test?.difficulty || 'Easy'}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{test?.name}</h2>
          </div>
          {!published && (
            <button onClick={() => navigate(`/tests/${id}/edit`)} className="text-primary hover:text-primary-dark p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
              <Pencil size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Subject:</span>
            <span className="font-medium text-gray-800">{typeof test?.subject === 'object' ? test?.subject?.name : test?.subject}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Type:</span>
            <span className="font-medium text-gray-800 capitalize">{test?.type?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 flex-shrink-0">Topics:</span>
            <div className="flex flex-wrap gap-1">
              {(test?.topics || []).map((t: any, i: number) => (
                <span key={i} className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                  {typeof t === 'object' ? t.name : t}
                </span>
              ))}
            </div>
          </div>
          {test?.sub_topics?.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-gray-500 flex-shrink-0">Sub Topics:</span>
              <div className="flex flex-wrap gap-1">
                {test.sub_topics.map((st: any, i: number) => (
                  <span key={i} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                    {typeof st === 'object' ? st.name : st}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock size={14} className="text-primary" />
            <span>{test?.total_time} Min</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <BookOpen size={14} className="text-primary" />
            <span>{displayedQuestions.length} Questions</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Target size={14} className="text-primary" />
            <span>{test?.total_marks} Marks</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="text-gray-500">Marking:</span>
            <span className="text-green-600 font-medium">+{test?.correct_marks}</span>
            <span className="text-red-500 font-medium">{test?.wrong_marks}</span>
            <span className="text-gray-500 font-medium">{test?.unattempt_marks}</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 text-sm">Questions ({displayedQuestions.length})</h3>
          {displayedQuestions.length === 0 && (
            <button onClick={() => navigate(`/tests/${id}/questions`)} className="text-xs text-primary hover:underline">+ Add questions</button>
          )}
        </div>
        {displayedQuestions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No questions added yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayedQuestions.map((q: any, i: number) => (
              <div key={i} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-3">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['option1', 'option2', 'option3', 'option4'] as const).map((opt, j) => (
                        <div key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                          q.correct_option === opt
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-gray-50 border-gray-100 text-gray-600'
                        }`}>
                          <span className="font-semibold text-xs">{String.fromCharCode(65 + j)}.</span>
                          {q[opt]}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                        <span className="font-semibold">Solution: </span>{q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {published && (
        <div className="flex justify-center pb-4">
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-10">
            Back to Dashboard
          </button>
        </div>
      )}

      {showPublish && (
        <PublishModal
          testId={id!}
          onClose={() => setShowPublish(false)}
          onSuccess={() => { setShowPublish(false); setPublished(true); }}
        />
      )}
    </div>
  );
}
