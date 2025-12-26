
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, LogIn, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [emailPart, setEmailPart] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Dialog State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  
  const { toast } = useToast();
  const { signIn, signUp, sendLoginLink } = useAuth();

  const domains = [
    { label: '@gmail.com', value: '@gmail.com' },
    { label: '@qq.com', value: '@qq.com' },
    { label: '@icloud.com', value: '@icloud.com' },
    { label: '@163.com', value: '@163.com' },
    { label: 'Manual Entry', value: 'other' },
  ];

  const getFullEmail = () => {
    if (selectedDomain === 'other') return emailPart;
    return `${emailPart}${selectedDomain}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullEmail = getFullEmail();

    if (!emailPart || (isLogin && !password)) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (isLogin) {
      const { error } = await signIn(fullEmail, password);
      if (!error) {
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      }
    } else {
      const username = fullEmail.split('@')[0];
      const { error } = await signUp(fullEmail, password, {
        data: { username: username }
      });
      
      if (!error) {
        toast({
          title: "Account Created!",
          description: "Please verify your email address before logging in.",
          className: "bg-green-50 border-green-200"
        });
        setIsLogin(true);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
          <div className="text-center mb-8">
            <motion.div
              key={isLogin ? 'login-icon' : 'register-icon'}
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg"
            >
              {isLogin ? <LogIn className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isLogin ? 'Welcome Back 欢迎朋友们来 建几千上万人大群 和加好友和开店 和赚ZEHEM币' : 'Join Community'}
            </h1>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to access your account请登录' : 'Create your account to get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><></>Email Address邮箱名称<br />（只写左边的）</label>
              <div className="flex gap-2">
                <input
                  type={selectedDomain === 'other' ? "email" : "text"}
                  value={emailPart}
                  onChange={(e) => setEmailPart(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white"
                  placeholder="username请填写用户名"
                  autoComplete="email"
                />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="px-2 sm:px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none w-[110px]"
                >
                  {domains.map((domain) => (
                    <option key={domain.value} value={domain.value}>{domain.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white pr-12"
                  placeholder="Password请填写密码"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6 text-lg font-semibold shadow-lg">
              {isLogin ? 'Sign In 登录' : 'Create Account'} <ArrowRight className="w-5 h-5 ml-2 opacity-80" />
            </Button>
          </form>

          <div className="mt-6 space-y-6">
             {isLogin && (
                <div className="text-right">
                    <button onClick={() => setIsForgotPasswordOpen(true)} className="text-sm text-purple-600 hover:underline">Forgot password?忘记密码？请点这</button>
                </div>
             )}

             <div className="text-center">
                <button onClick={toggleMode} className="text-gray-600 font-medium">
                  {isLogin ? (
  <>
    <span>Don't have an account?</span>
    <br />
    <span>没账户？</span>
    <br />
    <span className="text-purple-600">Sign up / 请点这注册</span>
  </>
) : (
  <>
    <span>Already have an account?</span>{" "}
    <span className="text-purple-600">Sign in / 登录</span>
  </>
)}

                </button>
             </div>
{/* 游客入口 */}
<div className="mt-4 text-center">
  <button
    type="button"
    onClick={() => {
      window.location.href = "moments";
    }}
    className="text-sm text-gray-500 hover:text-purple-600 underline"
  >
    <>
      Guest
      <br />
      以游客进入（不注册，仅观看）
    </>
  </button>

  <div className="mt-1 text-xs text-gray-400">
    游客不可发布朋友圈，不可创建群组
  </div>
</div>

          </div>
        </div>
      </motion.div>

      <ForgotPasswordDialog 
        isOpen={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </div>
  );
};

export default AuthPage;
