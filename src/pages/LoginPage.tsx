import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../api';
import { useAuthStore } from '../store';
import { Logo } from '../components/Logo';

const schema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await login(data.userId, data.password);
      const { token, user } = res.data.data;
      setAuth(token, user);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left illustration panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-12">
        <div className="text-center space-y-6">
          {/* Simple SVG illustration */}
          <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
            <circle cx="140" cy="140" r="130" fill="#EEF2FF" />
            {/* Desk */}
            <rect x="60" y="180" width="160" height="10" rx="3" fill="#94A3B8" />
            <rect x="80" y="190" width="8" height="50" rx="2" fill="#94A3B8" />
            <rect x="192" y="190" width="8" height="50" rx="2" fill="#94A3B8" />
            {/* Laptop */}
            <rect x="95" y="140" width="90" height="55" rx="4" fill="#CBD5E1" />
            <rect x="99" y="144" width="82" height="47" rx="2" fill="#F1F5F9" />
            <rect x="99" y="144" width="82" height="30" rx="2" fill="#E2E8F0" />
            {/* Screen glow */}
            <rect x="103" y="148" width="74" height="22" rx="2" fill="#BFDBFE" opacity="0.6" />
            {/* Robot/person */}
            <circle cx="140" cy="115" r="18" fill="#FCD34D" />
            <circle cx="133" cy="111" r="3" fill="#1E293B" />
            <circle cx="147" cy="111" r="3" fill="#1E293B" />
            <path d="M134 120 Q140 125 146 120" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <rect x="127" y="133" width="26" height="10" rx="3" fill="#A78BFA" />
            {/* Flask */}
            <path d="M165 90 L165 110 L175 130 L155 130 L165 110" stroke="#60A5FA" strokeWidth="2" fill="#BFDBFE" opacity="0.7" />
            <rect x="161" y="86" width="8" height="6" rx="1" fill="#60A5FA" />
            {/* Bubbles */}
            <circle cx="170" cy="118" r="3" fill="#60A5FA" opacity="0.5" />
            <circle cx="162" cy="112" r="2" fill="#60A5FA" opacity="0.4" />
          </svg>
          <div>
            <h2 className="text-2xl font-bold text-gray-700">Welcome to Preproute</h2>
            <p className="text-gray-500 mt-2 text-sm">Build & manage tests with ease</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-[420px] flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-sm mx-auto w-full space-y-8">
          <div>
            <Logo size="lg" />
            <h1 className="text-2xl font-bold text-gray-900 mt-6">Login</h1>
            <p className="text-sm text-gray-500 mt-1">Use your company provided Login credentials</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">User ID</label>
              <input
                {...register('userId')}
                placeholder="Enter User ID"
                className="input"
              />
              {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter Password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
