import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, ChevronRight, ChevronDown, Clock, BookOpen, Target } from 'lucide-react';
import { createQuestionsBulk, getTopicsBySubject, getSubTopicsByTopics, getTestById, updateTest, fetchBulkQuestions } from '../api';
import { useTestCreationStore } from '../store';
import type { Question } from '../types';

const qSchema = z.object({
  question: z.string().min(1, 'Question text required'),
  option1: z.string().min(1, 'Option 1 required'),
  option2: z.string().min(1, 'Option 2 required'),
  option3: z.string().min(1, 'Option 3 required'),
  option4: z.string().min(1, 'Option 4 required'),
  correct_option: z.string().min(1, 'Select correct option'),
  explanation: z.string().optional(),
  difficulty: z.string().optional(),
  topic_id: z.string().optional(),
  sub_topic_id: z.string().optional(),
  media_url: z.string().optional(),
});
type QFormData = z.infer<typeof qSchema>;

const OPTION_LABELS = ['option1', 'option2', 'option3', 'option4'] as const;

export function AddQuestionsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { questions, addQuestion, removeQuestion, setQuestions, setTestData } = useTestCreationStore();

  const [topics, setTopics] = useState<any[]>([]);
  const [subTopics, setSubTopics] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [testInfo, setTestInfo] = useState<any>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<QFormData>({
    resolver: zodResolver(qSchema),
    defaultValues: { correct_option: '', difficulty: '', topic_id: '', sub_topic_id: '' },
  });

  const selectedTopicId = watch('topic_id');
  const correct_option = watch('correct_option');

  useEffect(() => {
    if (id) {
      getTestById(id).then(r => {
        const t = r.data.data;
        setTestInfo(t);
        setTestData(t);
        const subjectId = typeof t.subject === 'object' ? t.subject?.id : t.subject;
        if (subjectId) getTopicsBySubject(subjectId).then(r2 => setTopics(r2.data.data || []));

        // Load existing questions if any
        if (t.questions?.length > 0) {
          fetchBulkQuestions(t.questions).then(r2 => {
            setQuestions(r2.data.data || []);
          }).catch(() => {});
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (selectedTopicId) {
      getSubTopicsByTopics([selectedTopicId]).then(r => setSubTopics(r.data.data || [])).catch(() => setSubTopics([]));
    }
  }, [selectedTopicId]);

  const onAddQuestion = (data: QFormData) => {
    const q: Question = { type: 'mcq', test_id: id!, ...data };
    if (editIndex !== null) {
      const updated = [...questions];
      updated[editIndex] = q;
      setQuestions(updated);
      setEditIndex(null);
    } else {
      addQuestion(q);
    }
    reset({ question: '', option1: '', option2: '', option3: '', option4: '', correct_option: '', explanation: '', difficulty: '', topic_id: '', sub_topic_id: '' });
    toast.success(editIndex !== null ? 'Question updated' : 'Question added');
  };

  const handleEdit = (index: number) => {
    const q = questions[index];
    setValue('question', q.question);
    setValue('option1', q.option1);
    setValue('option2', q.option2);
    setValue('option3', q.option3);
    setValue('option4', q.option4);
    setValue('correct_option', q.correct_option);
    setValue('explanation', q.explanation || '');
    setValue('difficulty', q.difficulty || '');
    setValue('topic_id', q.topic_id || '');
    setValue('sub_topic_id', q.sub_topic_id || '');
    setEditIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAndContinue = async () => {
    if (questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    setSaving(true);
    try {
      // Only save new questions (those without an id)
      const newQuestions = questions.filter(q => !q.id).map(q => ({ ...q, test_id: id }));
      let allQIds = questions.filter(q => q.id).map(q => q.id!);

      if (newQuestions.length > 0) {
        const res = await createQuestionsBulk(newQuestions);
        const created = res.data.data || [];
        allQIds = [...allQIds, ...created.map((q: any) => q.id)];
      }

      await updateTest(id!, {
        questions: allQIds,
        total_questions: allQIds.length,
        total_marks: testInfo?.total_marks || 0,
      });

      toast.success('Questions saved!');
      navigate(`/tests/${id}/preview`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Test Creation</span>
        <ChevronRight size={14} />
        <span>Create Test</span>
        <ChevronRight size={14} />
        <span className="text-primary font-medium">Add Questions</span>
      </div>

      {/* Test Details Banner */}
      {testInfo && (
        <div className="card p-4 bg-gradient-to-r from-primary/5 to-blue-50 border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {testInfo.type?.replace('_', ' ') || 'Chapter Wise'}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  testInfo.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  testInfo.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {testInfo.difficulty || 'Easy'}
                </span>
              </div>
              <h2 className="font-bold text-gray-900 text-lg">{testInfo.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-gray-600">
                  Subject: <strong>{typeof testInfo.subject === 'object' ? testInfo.subject?.name : testInfo.subject}</strong>
                </span>
                {testInfo.topics?.length > 0 && (
                  <div className="flex gap-1">
                    {testInfo.topics.slice(0, 3).map((t: any, i: number) => (
                      <span key={i} className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                        {typeof t === 'object' ? t.name : t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-primary" />
                <span>{testInfo.total_time} Min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" />
                <span>{testInfo.total_questions} Qs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target size={14} className="text-primary" />
                <span>{testInfo.total_marks} Marks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Form */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">
            {editIndex !== null ? `Edit Question ${editIndex + 1}` : `Question ${questions.length + 1}`}
          </h3>
          {questions.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {questions.length} question{questions.length !== 1 ? 's' : ''} added
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit(onAddQuestion)} className="space-y-5">
          {/* Question Text */}
          <div>
            <label className="label">Question Text</label>
            <textarea
              {...register('question')}
              placeholder="Type your question here..."
              rows={4}
              className="input resize-none"
            />
            {errors.question && <p className="text-red-500 text-xs mt-1">{errors.question.message}</p>}
          </div>

          {/* Options */}
          <div>
            <label className="label">Type the options below</label>
            <div className="space-y-2.5">
              {OPTION_LABELS.map((opt, i) => (
                <div key={opt} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('correct_option', opt)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      correct_option === opt ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    {correct_option === opt && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </button>
                  <input
                    {...register(opt)}
                    placeholder={`Type Option ${i + 1} here`}
                    className="input flex-1"
                  />
                </div>
              ))}
            </div>
            {errors.correct_option && <p className="text-red-500 text-xs mt-1">Select the correct option</p>}
          </div>

          {/* Explanation */}
          <div>
            <label className="label">Add Solution <span className="text-gray-400 font-normal">(Optional)</span></label>
            <textarea
              {...register('explanation')}
              placeholder="Type here..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Question Settings */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Question settings</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Level of Difficulty</label>
                <div className="relative">
                  <select {...register('difficulty')} className="input appearance-none pr-8">
                    <option value="">Select from Drop-down</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label">Topic</label>
                <div className="relative">
                  <select {...register('topic_id')} className="input appearance-none pr-8">
                    <option value="">Select from Drop-down</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label">Sub-topic</label>
                <div className="relative">
                  <select {...register('sub_topic_id')} className="input appearance-none pr-8" disabled={!selectedTopicId}>
                    <option value="">Select from Drop-down</option>
                    {subTopics.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate(`/tests/${id}/edit`)}
              className="btn-secondary text-sm"
            >
              ← Edit Test Creation
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              {editIndex !== null ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm">Added Questions ({questions.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {questions.map((q, i) => (
              <div key={i} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400">Q{i + 1}</span>
                    {q.difficulty && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{q.difficulty}</span>
                    )}
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      Ans: {q.correct_option?.replace('option', 'Option ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {(['option1', 'option2', 'option3', 'option4'] as const).map((opt, j) => (
                      <span key={opt} className={`text-xs px-2 py-0.5 rounded ${q.correct_option === opt ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                        {j + 1}. {q[opt]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => removeQuestion(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={handleSaveAndContinue}
          disabled={saving || questions.length === 0}
          className="btn-primary flex items-center gap-2 px-8"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
          {!saving && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
