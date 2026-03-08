import { clerkClient } from "@clerk/nextjs/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";

function getAdminUserIds() {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function requireAdminUserId() {
  const authResult = await requireAuthenticatedUserId();
  if (!authResult.userId) {
    return { userId: null, error: "Unauthorized", status: 401 as const };
  }

  const allowedIds = getAdminUserIds();
  if (!allowedIds.includes(authResult.userId)) {
    return { userId: null, error: "Admin access required", status: 403 as const };
  }

  return { userId: authResult.userId, error: null, status: 200 as const };
}

export async function getAllUsersBasic() {
  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 100 });
  return response.data.map((user) => ({
    id: user.id,
    email:
      user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
  }));
}
