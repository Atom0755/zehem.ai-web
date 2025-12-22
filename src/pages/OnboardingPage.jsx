import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";

/**
 * Onboarding page:
 * - user arrives here after clicking the email verification (magic link / OTP link)
 * - user sets username + password
 * - we upsert into `profiles` table and update Supabase Auth password
 */
export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const email = useMemo(() => user?.email ?? "", [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "Please open the verification link from your email again.",
      });
      return;
    }

    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter a username and password.",
      });
      return;
    }

    try {
      setSubmitting(true);

      // 1) set password for this (already verified) session
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw pwErr;

      // 2) upsert profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email,
            username: username.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileErr) throw profileErr;

      toast({
        title: "All set!",
        description: "Your account is ready. Redirecting…",
        className: "bg-green-50 border-green-200",
      });

      // redirect to home (app will show MainApp now that user is signed in)
      window.location.href = "/";
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Onboarding failed",
        description: err?.message || "Something went wrong",
      });
    } finally {
      setSubmitting(false);
      setPassword("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finish registration</h1>
          <p className="text-gray-600 mt-2">
            Verified email: <span className="font-medium">{email || "—"}</span>
          </p>
          {!user && (
            <p className="text-sm text-red-600 mt-3">
              We couldn’t find an active session. Please open the verification link from your email again.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white"
                placeholder="e.g. atom"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white"
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || !user}
            className="w-full h-12 rounded-xl gap-2"
          >
            {submitting ? "Saving…" : "Complete registration"}
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-gray-500 leading-relaxed">
            Tip: If you opened this page without clicking the email link, please go back to your inbox and click the verification link again.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
