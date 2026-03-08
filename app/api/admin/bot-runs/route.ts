import { NextResponse } from "next/server";
import { getAllUsersBasic, requireAdminUserId } from "@/lib/server/admin";
import { getAccountStateForUser } from "@/lib/server/account-state";
import { getInternalBotStatus } from "@/lib/server/bot-backend";

export async function GET(req: Request) {
  const admin = await requireAdminUserId();
  if (!admin.userId) {
    return NextResponse.json({ error: admin.error, code: "ADMIN_REQUIRED" }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const selectedUserId = searchParams.get("userId");

  if (selectedUserId) {
    const [accountState, statusResult] = await Promise.all([
      getAccountStateForUser(selectedUserId),
      getInternalBotStatus(selectedUserId),
    ]);

    return NextResponse.json({
      userId: selectedUserId,
      accountState,
      backendStatus: statusResult.ok ? statusResult.data : null,
      backendError: statusResult.ok ? null : { code: statusResult.code, message: statusResult.message },
    });
  }

  const users = await getAllUsersBasic();
  const rows = await Promise.all(
    users.map(async (user) => {
      const state = await getAccountStateForUser(user.id);
      return {
        ...user,
        walletAddress: state.walletAddress,
        botRunning: state.botRunning,
        botLifecycleState: state.botLifecycleState,
        liveModeEligible: Boolean(state.walletAddress && state.liveModeAcknowledgedAt),
        liveModeAcknowledgedAt: state.liveModeAcknowledgedAt,
        lastEvent: state.botEvents[0] || null,
        eventCount: state.botEvents.length,
      };
    })
  );

  return NextResponse.json({ users: rows });
}
