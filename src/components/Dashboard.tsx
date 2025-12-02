import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

function Dashboard() {
  // Only fetch the current user if a session cookie exists to avoid sending undefined/null.
  const hasSession =
    typeof document !== "undefined" &&
    document.cookie.split(";").some(cookie => cookie.trim().startsWith("app_session_id="));

  const {
    data: user,
    isLoading: userLoading,
  } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    enabled: hasSession,
  });

  // Always send a valid filter string (empty string when no filter is applied).
  const {
    data: leads,
    isLoading: leadsLoading,
  } = trpc.leads.list.useQuery(
    { filter: "" },
    {
      enabled: Boolean(user),
    }
  );

  const isLoading = userLoading || leadsLoading || (hasSession && !user);

  const leadItems = useMemo(() => leads ?? [], [leads]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to continue.</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <h2>Leads:</h2>
      <ul>
        {leadItems.map(lead => (
          <li key={lead.id}>{lead.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
