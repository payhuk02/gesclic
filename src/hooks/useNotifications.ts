import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
<<<<<<< HEAD
import { useClinic } from "@/contexts/ClinicContext";
=======
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  related_id: string | null;
  related_type: string | null;
<<<<<<< HEAD
  clinic_id: string | null;
=======
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
<<<<<<< HEAD
  const { activeClinicId } = useClinic();
=======
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
<<<<<<< HEAD
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);
    // Notifications de la clinique active + notifications globales (sans clinique)
    if (activeClinicId) query = query.or(`clinic_id.eq.${activeClinicId},clinic_id.is.null`);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
    if (!error && data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [user, activeClinicId]);
=======
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [user]);
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
<<<<<<< HEAD
          if (activeClinicId && n.clinic_id && n.clinic_id !== activeClinicId) return;
=======
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
          setNotifications((prev) => [n, ...prev]);
          toast(n.title, { description: n.message ?? undefined });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => prev.map((x) => (x.id === n.id ? n : x)));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const old = payload.old as { id: string };
          setNotifications((prev) => prev.filter((x) => x.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
<<<<<<< HEAD
  }, [user, activeClinicId]);
=======
  }, [user]);
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
<<<<<<< HEAD
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
=======
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, remove, refetch: fetchNotifications };
};
