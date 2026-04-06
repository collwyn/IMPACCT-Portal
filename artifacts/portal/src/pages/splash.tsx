import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, User, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const ROLES = [
  {
    key: "admin",
    label: "Admin",
    person: "Portal Administrator",
    email: "admin@impacctbrooklyn.org",
    password: "Admin1234!",
    icon: Shield,
    color: "from-primary to-primary/80",
    ringColor: "ring-primary/40",
    description: "Full access — manage users, departments, submissions, and all resources.",
  },
  {
    key: "depthead",
    label: "Department Head",
    person: "Jordan Rivera — Housing",
    email: "jordan@impacctbrooklyn.org",
    password: "Housing123!",
    icon: Building2,
    color: "from-teal-700 to-teal-600",
    ringColor: "ring-teal-500/40",
    description: "Review and approve department submissions, message staff, manage resources.",
  },
  {
    key: "staff",
    label: "Department Staff",
    person: "Stephanie Blue — Housing",
    email: "stephanie@impacctbrooklyn.org",
    password: "Staff1234!",
    icon: User,
    color: "from-blue-700 to-blue-600",
    ringColor: "ring-blue-500/40",
    description: "Create submissions, message colleagues, and browse the resource directory.",
  },
];

export default function Splash() {
  const { toast } = useToast();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        // Hard redirect so the auth state is fetched fresh — avoids the stale
        // 401 cache in React Query bouncing the user back to the splash page.
        window.location.href = "/dashboard";
      },
      onError: () => {
        setLoadingKey(null);
        toast({
          title: "Sign-in failed",
          description: "Could not connect. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  function handleRoleClick(role: (typeof ROLES)[number]) {
    if (loadingKey) return;
    setLoadingKey(role.key);
    loginMutation.mutate({ data: { email: role.email, password: role.password } });
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/login-bg.jpg"
          alt="Brooklyn"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="bg-white rounded-2xl px-6 py-4 shadow-xl inline-block">
            <img src="/impacct-logo.jpg" alt="IMPACCT Brooklyn" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-center text-white/80 text-sm font-medium tracking-widest uppercase mt-4">
            Web Portal
          </p>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Select your role to continue
          </h1>
          <p className="text-white/60 text-sm">
            This portal is for IMPACCT Brooklyn staff only.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            const isLoading = loadingKey === role.key;
            const isDisabled = !!loadingKey && !isLoading;

            return (
              <motion.button
                key={role.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.08 }}
                onClick={() => handleRoleClick(role)}
                disabled={!!loadingKey}
                className={`
                  group relative flex flex-col items-start text-left
                  bg-white/10 backdrop-blur-md border border-white/20
                  rounded-2xl p-6 shadow-xl
                  transition-all duration-200
                  ring-2 ring-transparent
                  ${!loadingKey ? `hover:bg-white/20 hover:${role.ringColor} hover:scale-[1.02] cursor-pointer` : ""}
                  ${isLoading ? `bg-white/20 ${role.ringColor} scale-[1.02]` : ""}
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg`}>
                  {isLoading
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <Icon className="w-6 h-6 text-white" />
                  }
                </div>

                {/* Text */}
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">
                  {role.label}
                </p>
                <h2 className="text-lg font-display font-bold text-white mb-2 leading-tight">
                  {role.person}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed flex-1">
                  {role.description}
                </p>

                {/* CTA */}
                <div className={`mt-5 flex items-center gap-1.5 text-sm font-semibold transition-colors
                  ${isLoading ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                  {isLoading ? "Signing in…" : "Sign in"}
                  {!isLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Fallback link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-10 text-white/40 text-xs"
        >
          Staff member with your own credentials?{" "}
          <a href="/login" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">
            Sign in manually
          </a>
        </motion.p>
      </div>
    </div>
  );
}
