import { RightSidebarClient } from "./RightSidebarClient";
import { getSuggestedUsers, getTrends } from "@/lib/actions/sidebar.actions";

export async function RightSidebar() {
  // Obtener datos reales de las Server Actions
  const [whoToFollow, trendingTopics] = await Promise.all([
    getSuggestedUsers(3),
    getTrends(10),
  ]);

  return (
    <RightSidebarClient
      whoToFollow={whoToFollow}
      trendingTopics={trendingTopics}
    />
  );
}
