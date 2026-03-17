import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { 
  useGetDepartmentUsers, 
  useListMessages, 
  useGetMessageThread, 
  useSendMessage, 
  useMarkMessageRead 
} from "@workspace/api-client-react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse ?user=ID from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userParam = searchParams.get('user');
    if (userParam) {
      setSelectedUserId(parseInt(userParam, 10));
    }
  }, [location]);

  const { data: departmentUsers = [] } = useGetDepartmentUsers();
  const { data: inboxMessages = [], refetch: refetchInbox } = useListMessages();
  
  const { 
    data: threadMessages = [], 
    isLoading: isLoadingThread,
    refetch: refetchThread
  } = useGetMessageThread(selectedUserId!, {
    query: {
      enabled: !!selectedUserId,
      refetchInterval: 3000,
    }
  });

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        setMessageBody("");
        refetchThread();
        refetchInbox();
      }
    }
  });

  const markReadMutation = useMarkMessageRead({
    mutation: {
      onSuccess: () => {
        refetchInbox();
      }
    }
  });

  // Mark unread messages as read when viewing thread
  useEffect(() => {
    if (selectedUserId && threadMessages.length > 0) {
      const unreadReceived = threadMessages.filter(
        m => !m.is_read && m.recipient_id === user?.id
      );
      
      unreadReceived.forEach(m => {
        markReadMutation.mutate({ id: m.id });
      });
    }
  }, [threadMessages, selectedUserId, user?.id]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || !selectedUserId) return;
    
    sendMessageMutation.mutate({
      data: {
        recipient_id: selectedUserId,
        body: messageBody.trim()
      }
    });
  };

  const deptMembers = departmentUsers.filter(u => u.id !== user?.id);
  const selectedUser = deptMembers.find(u => u.id === selectedUserId);

  // Compute unread counts per user
  const unreadCounts = inboxMessages.reduce((acc, msg) => {
    if (!msg.is_read && msg.recipient_id === user?.id) {
      acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  return (
    <DashboardLayout>
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden h-[calc(100vh-140px)] flex">
        
        {/* LEFT PANEL: Users List */}
        <div className="w-1/3 border-r border-border/50 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-border/50 bg-card">
            <h2 className="font-display font-bold text-lg text-foreground">Messages</h2>
            <p className="text-xs text-muted-foreground mt-1">Direct messages with your team</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {deptMembers.length > 0 ? (
              deptMembers.map(member => {
                const unreadCount = unreadCounts[member.id] || 0;
                const isSelected = selectedUserId === member.id;
                
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedUserId(member.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                      isSelected 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-slate-100"
                    )}
                  >
                    <div className="relative">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`} 
                        alt={member.name}
                        className={cn(
                          "w-10 h-10 rounded-full",
                          isSelected ? "bg-primary-foreground/20" : "bg-slate-200"
                        )}
                      />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-card">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-semibold truncate",
                        isSelected ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {member.name}
                      </p>
                      <p className={cn(
                        "text-xs truncate capitalize",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {member.job_title || member.role.replace('_', ' ')}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <p className="text-sm">No other team members found.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Thread */}
        <div className="flex-1 flex flex-col bg-card relative">
          {selectedUserId ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-card/50 backdrop-blur-sm z-10 sticky top-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser?.name || '')}`} 
                  alt={selectedUser?.name}
                  className="w-10 h-10 rounded-full bg-slate-100"
                />
                <div>
                  <h3 className="font-semibold text-foreground">{selectedUser?.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{selectedUser?.job_title || selectedUser?.role.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {isLoadingThread ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                  </div>
                ) : threadMessages.length > 0 ? (
                  threadMessages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative group",
                          isOwn 
                            ? "bg-primary text-primary-foreground rounded-tr-sm" 
                            : "bg-white border border-border/50 text-foreground rounded-tl-sm"
                        )}>
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                          <span className={cn(
                            "text-[10px] mt-1.5 block opacity-70",
                            isOwn ? "text-primary-foreground/80 text-right" : "text-muted-foreground text-left"
                          )}>
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                    <MessageSquare className="w-12 h-12 mb-3" />
                    <p>No messages yet.</p>
                    <p className="text-sm mt-1">Send a message to start the conversation.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose Area */}
              <div className="p-4 border-t border-border/50 bg-card">
                <form onSubmit={handleSend} className="flex gap-3">
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 resize-none h-12 min-h-[48px] max-h-32 rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!messageBody.trim() || sendMessageMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center bg-slate-50/30">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <MessageSquare className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">Your Messages</h3>
              <p className="max-w-xs">Select a team member from the list to start a conversation or view history.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}