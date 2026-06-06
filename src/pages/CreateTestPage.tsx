import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getSubjects, getTopicsBySubject, getSubTopicsByTopics, createTest, updateTest, getTestById } from '../api';
import { useTestCreationStore } from '../store';
import type { Subject, Topic, SubTopic } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Test name is required'),
  type: z.string().min(1, 'Type is required'),
  subject: z.string().min(1, 'Subject is required'),
  topics: z.array(z.string()).min(1, 'Select at least one topic'),
  sub_topics: z.array(z.string()),
  difficulty: z.string().min(1, 'Difficulty is required'),
  correct_marks: z.number(),
  wrong_marks: z.number(),
  unattempt_marks: z.number(),
  total_time: z.number().min(1, 'Duration required'),
  total_marks: z.number().min(1, 'Total marks required'),
  total_questions: z.number().min(1, 'No of questions required'),
});
type FormData = z.infer<typeof schema>;

const TEST_TYPES = [
  { value: 'chapter_wise', label: 'Chapter Wise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock_test', label: 'Mock Test' },
];

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'difficult'];

function MultiSelect({
  label, options, selected, onChange, placeholder, disabled,
}: {
  label: string; options: { id: string; name: string }[];
  selected: string[]; onChange: (v: string[]) => void;
  placeholder: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedNames = options.filter(o => selected.includes(o.id)).map(o => o.name);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  return (
    <div className="relative">
      <label className="label">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="input flex items-center justify-between text-left disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className={selectedNames.length ? 'text-gray-800' : 'text-gray-400'}>
          {selectedNames.length ? (
            <div className="flex flex-wrap gap-1">
              {selectedNames.map(n => (
                <span key={n} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{n}</span>
              ))}
            </div>
          ) : placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400 flex-shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No options available</div>
          ) : options.map(o => (
            <label key={o.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => toggle(o.id)}
                className="accent-primary"
              />
              {o.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function NumberStepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white w-32">
        <button type="button" onClick={() => onChange(value - 1)} className="px-3 py-2 hover:bg-gray-50 text-gray-600 text-lg font-medium">−</button>
        <span className="flex-1 text-center text-sm font-medium">{value >= 0 ? '+' : ''}{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="px-3 py-2 hover:bg-gray-50 text-gray-600 text-lg font-medium">+</button>
      </div>
    </div>
  );
}

export function CreateTestPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { setTestId, setTestData } = useTestCreationStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chapter_wise');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'chapter_wise',
      difficulty: 'easy',
      topics: [],
      sub_topics: [],
      correct_marks: 5,
      wrong_marks: -1,
      unattempt_marks: 0,
      total_time: 60,
      total_marks: 250,
      total_questions: 50,
    },
  });

  const selectedSubject = watch('subject');
  const selectedTopics = watch('topics');
  const difficulty = watch('difficulty');
  const correct_marks = watch('correct_marks');
  const wrong_marks = watch('wrong_marks');
  const unattempt_marks = watch('unattempt_marks');

  useEffect(() => {
    getSubjects().then(r => setSubjects(r.data.data || []));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      getTestById(id).then(r => {
        const t = r.data.data;
        setValue('name', t.name);
        setValue('type', t.type || 'chapter_wise');
        setValue('subject', typeof t.subject === 'object' ? t.subject?.id : t.subject);
        setValue('difficulty', t.difficulty || 'easy');
        setValue('correct_marks', t.correct_marks || 5);
        setValue('wrong_marks', t.wrong_marks || -1);
        setValue('unattempt_marks', t.unattempt_marks || 0);
        setValue('total_time', t.total_time || 60);
        setValue('total_marks', t.total_marks || 250);
        setValue('total_questions', t.total_questions || 50);
        const topicIds = (t.topics || []).map((tp: any) => typeof tp === 'object' ? tp.id : tp);
        setValue('topics', topicIds);
        const subTopicIds = (t.sub_topics || []).map((st: any) => typeof st === 'object' ? st.id : st);
        setValue('sub_topics', subTopicIds);
      });
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (selectedSubject) {
      getTopicsBySubject(selectedSubject).then(r => {
        setTopics(r.data.data || []);
        if (!isEdit) {
          setValue('topics', []);
          setValue('sub_topics', []);
        }
      });
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedTopics?.length > 0) {
      getSubTopicsByTopics(selectedTopics).then(r => {
        setSubTopics(r.data.data || []);
      }).catch(() => {
        setSubTopics([]);
      });
    } else {
      setSubTopics([]);
    }
  }, [JSON.stringify(selectedTopics)]);

  const onSubmit = async (data: FormData, isDraft = false) => {
    setLoading(true);
    try {
      const payload = { ...data, status: isDraft ? 'draft' : null };
      let res;
      if (isEdit && id) {
        res = await updateTest(id, payload);
        toast.success('Test updated!');
        setTestId(id);
      } else {
        res = await createTest(payload);
        toast.success('Test created!');
        setTestId(res.data.data.id);
      }
      setTestData(res.data.data);
      if (!isDraft) navigate(isEdit ? `/tests/${id || res.data.data.id}/questions` : `/tests/${res.data.data.id}/questions`);
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save test');
    } finally {
      setLoading(false);
    }
  };

  const tabLabels: Record<string, string> = { chapter_wise: 'Chapter Wise', pyq: 'PYQ', mock_test: 'Mock Test' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Test Creation</span>
        <ChevronRight size={14} />
        <span>{isEdit ? 'Edit Test' : 'Create Test'}</span>
        <ChevronRight size={14} />
        <span className="text-primary font-medium">{tabLabels[activeTab]}</span>
      </div>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 pt-4">
          {TEST_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setActiveTab(value); setValue('type', value); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors mr-2 ${
                activeTab === value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit((d) => onSubmit(d, false))} className="p-6 space-y-6">
          {/* Row 1: Subject + Test Name */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Subject</label>
              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select {...field} className="input appearance-none pr-8">
                      <option value="">Choose from Drop-down</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              />
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="label">Name of Test</label>
              <input {...register('name')} placeholder="Enter name of Test" className="input" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
          </div>

          {/* Row 2: Topic + Sub Topic */}
          <div className="grid grid-cols-2 gap-6">
            <Controller
              name="topics"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Topic"
                  options={topics}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Choose from Drop-down"
                  disabled={!selectedSubject}
                />
              )}
            />
            <Controller
              name="sub_topics"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Sub Topic"
                  options={subTopics}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Choose from Drop-down"
                  disabled={selectedTopics?.length === 0}
                />
              )}
            />
          </div>

          {/* Row 3: Duration + Difficulty */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Duration (Minutes)</label>
              <input
                type="number"
                {...register('total_time', { valueAsNumber: true })}
                placeholder="Enter the time"
                className="input"
              />
              {errors.total_time && <p className="text-red-500 text-xs mt-1">{errors.total_time.message}</p>}
            </div>
            <div>
              <label className="label">Test Difficulty Level</label>
              <div className="flex items-center gap-6 mt-1">
                {DIFFICULTY_OPTIONS.map(d => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setValue('difficulty', d)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                        difficulty === d ? 'border-primary' : 'border-gray-300'
                      }`}
                    >
                      {difficulty === d && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm capitalize text-gray-700">{d}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Marking Scheme */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Marking Scheme:</h3>
            <div className="grid grid-cols-5 gap-4">
              <NumberStepper label="Wrong Answer" value={wrong_marks} onChange={v => setValue('wrong_marks', v)} />
              <NumberStepper label="Unattempted" value={unattempt_marks} onChange={v => setValue('unattempt_marks', v)} />
              <NumberStepper label="Correct Answer" value={correct_marks} onChange={v => setValue('correct_marks', v)} />
              <div>
                <label className="label">No of Questions</label>
                <input type="number" {...register('total_questions', { valueAsNumber: true })} placeholder="Ex:250" className="input" />
                {errors.total_questions && <p className="text-red-500 text-xs mt-1">{errors.total_questions.message}</p>}
              </div>
              <div>
                <label className="label">Total Marks</label>
                <input type="number" {...register('total_marks', { valueAsNumber: true })} placeholder="Ex:250" className="input" />
                {errors.total_marks && <p className="text-red-500 text-xs mt-1">{errors.total_marks.message}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit((d) => onSubmit(d, true))}
              disabled={loading}
              className="btn-secondary border-primary/30 text-primary hover:bg-primary/5"
            >
              Save as Draft
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Next'}
              {!loading && <ChevronRight size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
