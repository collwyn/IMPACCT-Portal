import { Shield, Building2, User, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const ROLES = [
  {
    key: "admin",
    persona: "admin",
    label: "Admin",
    person: "Portal Administrator",
    icon: Shield,
    color: "from-primary to-primary/80",
    description: "Full access — manage users, departments, submissions, and all resources.",
  },
  {
    key: "depthead",
    persona: "depthead",
    label: "Department Head",
    person: "Jordan Rivera — Housing",
    icon: Building2,
    color: "from-teal-700 to-teal-600",
    description: "Review and approve department submissions, message staff, manage resources.",
  },
  {
    key: "staff",
    persona: "staff",
    label: "Department Staff",
    person: "Stephanie Blue — Housing",
    icon: User,
    color: "from-blue-700 to-blue-600",
    description: "Create submissions, message colleagues, and browse the resource directory.",
  },
];

function setPersonaCookie(persona: string) {
  // Expires in 1 day; SameSite=Lax works for same-origin; Secure for production
  const expires = new Date(Date.now() + 86400000).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `persona=${persona}; path=/; expires=${expires}; SameSite=Lax${secure}`;
}

export default function Splash() {
  function handleRoleClick(persona: string) {
    setPersonaCookie(persona);
    window.location.href = "/dashboard";
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
            return (
              <motion.button
                key={role.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.08 }}
                onClick={() => handleRoleClick(role.persona)}
                className="group flex flex-col items-start text-left bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl transition-all duration-200 hover:bg-white/20 hover:scale-[1.02] cursor-pointer ring-2 ring-transparent hover:ring-white/30"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
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
                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                  Open dashboard
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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
