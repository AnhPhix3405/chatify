import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'weak', color: 'red', score: 1 };
    if (password.length < 10 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 'medium', color: 'yellow', score: 2 };
    }
    return { strength: 'strong', color: 'green', score: 3 };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // Simulate API check
    setTimeout(() => {
      const taken = ['admin', 'user', 'test', 'chatify'].includes(username.toLowerCase());
      setUsernameAvailable(!taken);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (passwordStrength.score < 2) newErrors.password = 'Password is too weak';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await register(formData);
    } catch {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'username') {
      checkUsernameAvailability(value);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Create your account <span className="inline-block animate-pulse">🚀</span>
        </h2>
        <p className="text-white/70">Join the conversation and connect with others</p>
      </div>

      {errors.general && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                errors.fullName ? 'border-red-500' : 'border-white/20'
              } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.fullName && (
            <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Username Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full pl-12 pr-12 py-3 bg-white/10 border ${
                errors.username ? 'border-red-500' : 
                usernameAvailable === true ? 'border-green-500' :
                usernameAvailable === false ? 'border-red-500' : 'border-white/20'
              } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Choose a username"
            />
            {usernameAvailable === true && (
              <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
            )}
            {usernameAvailable === false && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-400">✕</div>
            )}
          </div>
          {errors.username && (
            <p className="text-red-400 text-sm mt-1">{errors.username}</p>
          )}
          {usernameAvailable === false && !errors.username && (
            <p className="text-red-400 text-sm mt-1">Username is already taken</p>
          )}
          {usernameAvailable === true && (
            <p className="text-green-400 text-sm mt-1">Username is available</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                errors.email ? 'border-red-500' : 'border-white/20'
              } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-12 pr-16 py-3 bg-white/10 border ${
                errors.password ? 'border-red-500' : 'border-white/20'
              } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="Create a password"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {formData.password && passwordStrength.score === 3 && (
                <Check className="w-4 h-4 text-green-400" />
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Password Strength Bar */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex space-x-1 mb-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-2 rounded-full ${
                      level <= passwordStrength.score
                        ? passwordStrength.color === 'red' ? 'bg-red-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                        : 'bg-white/20'
                    } transition-colors duration-200`}
                  />
                ))}
              </div>
              <p className={`text-xs ${
                passwordStrength.color === 'red' ? 'text-red-400' :
                passwordStrength.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
              }`}>
                Password strength: {passwordStrength.strength}
              </p>
            </div>
          )}
          
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Sign Up Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Sign Up</span>
              </>
            )}
          </div>
        </button>

        {/* Switch to Login */}
        <div className="text-center">
          <p className="text-white/70">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-purple-300 hover:text-purple-200 font-semibold transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
