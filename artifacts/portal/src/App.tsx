import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import SubmissionsList from "@/pages/submissions/index";
import NewSubmission from "@/pages/submissions/new";
import SubmissionDetail from "@/pages/submissions/detail";
import ResourcesList from "@/pages/resources/index";
import NewResource from "@/pages/resources/new";
import AdminUsers from "@/pages/admin/users";
import AdminDepartments from "@/pages/admin/departments";
import AdminCategories from "@/pages/admin/categories";
import Messages from "@/pages/messages";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      
      <Route path="/messages" component={Messages} />

      <Route path="/submissions" component={SubmissionsList} />
      <Route path="/submissions/new" component={NewSubmission} />
      <Route path="/submissions/:id" component={SubmissionDetail} />
      
      <Route path="/resources" component={ResourcesList} />
      <Route path="/resources/new" component={NewResource} />
      
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/departments" component={AdminDepartments} />
      <Route path="/admin/categories" component={AdminCategories} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;