import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Send,
  FileText,
  FolderOpen,
  MessageSquare,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from "lucide-react";

interface Step {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  description: string;
  bullets: string[];
  roles?: ("admin" | "department_head" | "staff")[];
}

const ALL_STEPS: Step[] = [
  {
    icon: Sparkles,
    iconBg: "bg-primary",
    title: "Welcome to the IMPACCT Web Portal",
    description:
      "This is your internal hub for managing content submissions, team communications, and shared resources. Let's take a quick tour.",
    bullets: [
      "Designed exclusively for IMPACCT Brooklyn staff",
      "Submit content requests and track their progress",
      "Connect with teammates and access shared tools",
    ],
  },
  {
    icon: LayoutDashboard,
    iconBg: "bg-blue-500",
    title: "Your Dashboard",
    description:
      "The Dashboard is your home base. At a glance you can see your recent activity, department colleagues, and quick-action shortcuts.",
    bullets: [
      "Your profile and department are shown on the left",
      "Recent submissions appear in the activity feed",
      'Use "Create submission for website update" to get started',
    ],
  },
  {
    icon: Send,
    iconBg: "bg-amber-500",
    title: "Submitting Content",
    description:
      "Need something published on the website or shared with the team? Use New Submission to send a request with all the details.",
    bullets: [
      "Choose a submission type (event, update, resource, etc.)",
      "Attach a URL or document link if needed",
      "Set your preferred publish date and add notes",
      "Track status from Draft → Pending → Published",
    ],
  },
  {
    icon: FileText,
    iconBg: "bg-violet-500",
    title: "Tracking Submissions",
    description:
      "Every submission moves through a clear workflow. You'll always know exactly where a request stands.",
    bullets: [
      "Draft — saved but not yet submitted",
      "Pending Review — waiting for department head approval",
      "Approved — passed to the web team",
      "Published — live on the website",
    ],
    roles: ["admin", "department_head"],
  },
  {
    icon: MessageSquare,
    iconBg: "bg-teal-500",
    title: "Team Messages",
    description:
      "Send direct messages to any member of your department — ask questions, share updates, or follow up on a submission.",
    bullets: [
      "Open Messages from the sidebar",
      "Start a new thread by selecting a team member",
      "Unread messages show a red badge on the sidebar icon",
      "Threads refresh automatically every few seconds",
    ],
  },
  {
    icon: FolderOpen,
    iconBg: "bg-orange-500",
    title: "Shared Resources",
    description:
      "The Resource Directory holds all the tools, platforms, and partner contacts your team uses regularly — all in one place.",
    bullets: [
      "Browse by category (SaaS tools, grant portals, partner orgs…)",
      "Each card shows login instructions and access level",
      "Filter or search to find what you need quickly",
      "Admins can add new resources from the Resources page",
    ],
  },
  {
    icon: Users,
    iconBg: "bg-rose-500",
    title: "Admin Controls",
    description:
      "As an admin, you have additional tools to manage the team, departments, and submission categories.",
    bullets: [
      "Manage Users — add staff, change roles, reset access",
      "Departments — create and edit department records",
      "Categories — manage content submission categories",
      "All submissions are visible to admins across departments",
    ],
    roles: ["admin"],
  },
  {
    icon: CheckCircle2,
    iconBg: "bg-primary",
    title: "You're all set!",
    description:
      "That's everything you need to know to get started. You can revisit this tour anytime from your profile settings.",
    bullets: [
      "Use the sidebar to navigate between sections",
      "Questions? Message a colleague directly",
      "The Help link in your profile opens this tour again",
    ],
  },
];

export function OnboardingWizard() {
  const { user, isAdmin, isDeptHead } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const storageKey = user ? `impacct_onboarded_${user.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const done = localStorage.getItem(storageKey);
    if (!done) setOpen(true);
  }, [storageKey]);

  useEffect(() => {
    const handler = () => {
      setStep(0);
      setDirection(1);
      setOpen(true);
    };
    window.addEventListener("open-onboarding-tour", handler);
    return () => window.removeEventListener("open-onboarding-tour", handler);
  }, []);

  const steps = ALL_STEPS.filter((s) => {
    if (!s.roles) return true;
    if (isAdmin && s.roles.includes("admin")) return true;
    if (isDeptHead && s.roles.includes("department_head")) return true;
    return false;
  });

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function dismiss() {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setOpen(false);
  }

  function next() {
    if (isLast) { dismiss(); return; }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function back() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  if (!open || !current) return null;

  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="p-8 pb-6"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${current.iconBg} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h2 className="text-2xl font-display font-bold text-foreground mb-3 leading-tight">
                  {current.title}
                </h2>
                <p className="text-muted-foreground text-[15px] leading-relaxed mb-5">
                  {current.description}
                </p>

                <ul className="space-y-2.5">
                  {current.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="px-8 pb-7 flex items-center justify-between gap-4">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                    className={`rounded-full transition-all duration-200 ${
                      i === step
                        ? "w-6 h-2 bg-primary"
                        : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={back}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {isLast ? "Get Started" : "Next"}
                  {!isLast && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-muted/40">
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
