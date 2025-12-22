
import React, { useState } from 'react';
import { KeyRound, RefreshCw, CheckCircle2, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

const ForgotPasswordDialog = ({ isOpen, onOpenChange, users, onUpdateUsers }) => {
  const [mode, setMode] = useState(null); // 'retrieve' | 'reset'
  const [step, setStep] = useState('email'); // 'email' | 'verify' | 'new-password'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const resetState = () => {
    setMode(null);
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleClose = (open) => {
    onOpenChange(open);
    if (!open) setTimeout(resetState, 300);
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Password must contain uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Password must contain lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain a number";
    return null;
  };

  const handleRetrieve = () => {
    if (!email) return toast({ title: "Error", description: "Enter your email", variant: "destructive" });
    
    // Simulate lookup
    const user = users.find(u => u.email === email);
    if (user) {
        toast({ 
            title: "📧 Email Sent", 
            description: `We've sent your current password to ${email}.`,
            className: "bg-green-50 border-green-200"
        });
    } else {
        // Security best practice: don't reveal user existence, but for this demo we just simulate success
        toast({ 
            title: "📧 Email Sent", 
            description: `If an account exists for ${email}, the password has been sent.`,
            className: "bg-blue-50 border-blue-200"
        });
    }
    handleClose(false);
  };

  const handleSendResetCode = () => {
    if (!email) return toast({ title: "Error", description: "Enter your email", variant: "destructive" });
    toast({ 
        title: "📨 Code Sent", 
        description: `Verification code sent to ${email}. (Try 123456)`,
    });
    setStep('verify');
  };

  const handleVerifyCode = () => {
    if (code !== '123456') return toast({ title: "Error", description: "Invalid code. Try 123456", variant: "destructive" });
    setStep('new-password');
  };

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    
    const error = validatePassword(newPassword);
    if (error) return toast({ title: "Invalid Password", description: error, variant: "destructive" });

    // Update user in local storage
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex >= 0) {
        const updatedUsers = [...users];
        updatedUsers[userIndex].password = newPassword;
        onUpdateUsers(updatedUsers);
        
        toast({ 
            title: "🔐 Password Reset Complete", 
            description: `Your new credentials have been sent to ${email}.`,
            className: "bg-green-50 border-green-200"
        });
    } else {
         toast({ title: "Notice", description: "User not found (Simulation completed)" });
    }
    handleClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Password Recovery</DialogTitle>
          <DialogDescription>
            {!mode ? "Choose a recovery method." : mode === 'retrieve' ? "Retrieve current password." : "Reset forgotten password."}
          </DialogDescription>
        </DialogHeader>

        {!mode && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-28 flex flex-col gap-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
              onClick={() => setMode('retrieve')}
            >
              <div className="p-3 bg-blue-100 rounded-full">
                <KeyRound className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <span className="font-semibold block">Retrieve</span>
                <span className="text-xs font-normal text-muted-foreground block leading-tight">Send my current password to email</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-28 flex flex-col gap-3 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all"
              onClick={() => setMode('reset')}
            >
              <div className="p-3 bg-purple-100 rounded-full">
                <RefreshCw className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-1">
                <span className="font-semibold block">Reset</span>
                <span className="text-xs font-normal text-muted-foreground block leading-tight">Set a new password via verification</span>
              </div>
            </Button>
          </div>
        )}

        {mode === 'retrieve' && (
          <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="email" 
                  className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setMode(null)} className="w-full sm:w-auto">Back</Button>
              <Button onClick={handleRetrieve} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">Send Password</Button>
            </DialogFooter>
          </div>
        )}

        {mode === 'reset' && (
          <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {step === 'email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Email for Code</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                      type="email" 
                      className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setMode(null)} className="w-full sm:w-auto">Back</Button>
                  <Button onClick={handleSendResetCode} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">Send Code</Button>
                </DialogFooter>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <label className="text-sm font-medium block">Enter Verification Code</label>
                  <p className="text-xs text-muted-foreground mb-4">Sent to {email}</p>
                  <div className="flex justify-center">
                    <input 
                        type="text" 
                        className="w-48 text-center text-2xl tracking-[0.5em] font-mono py-2 border-b-2 border-purple-200 focus:border-purple-600 outline-none bg-transparent" 
                        placeholder="000000"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setStep('email')} className="w-full sm:w-auto">Back</Button>
                  <Button onClick={handleVerifyCode} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">Verify & Continue</Button>
                </DialogFooter>
              </div>
            )}

            {step === 'new-password' && (
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border rounded-md" 
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border rounded-md" 
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                 </div>
                 <DialogFooter>
                    <Button onClick={handleResetPassword} className="w-full bg-green-600 hover:bg-green-700">
                       <CheckCircle2 className="w-4 h-4 mr-2" />
                       Reset Password
                    </Button>
                 </DialogFooter>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
