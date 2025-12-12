"use client";

import { useEffect } from "react";
import { markAllNotificationsAsRead } from "@/lib/actions/notification.actions";

interface NotificationsReaderProps {
  unreadCount: number;
}

export function NotificationsReader({ unreadCount }: NotificationsReaderProps) {
  useEffect(() => {
    if (unreadCount > 0) {
      const markRead = async () => {
        try {
          await markAllNotificationsAsRead();
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      };

      markRead();
    }
  }, [unreadCount]);

  return null;
}

