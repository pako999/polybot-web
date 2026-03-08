import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { buildBotStatusResponse } from "@/lib/server/bot-status";

const encoder = new TextEncoder();

function writeEvent(data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function GET(req: Request) {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error, code: "AUTH_REQUIRED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const sendStatus = async () => {
        if (closed) return;
        try {
          const payload = await buildBotStatusResponse(userId);
          controller.enqueue(writeEvent(payload));
        } catch {
          controller.enqueue(
            writeEvent({
              running: false,
              lifecycleState: "error",
              lastError: "Unable to stream bot status.",
              errorCode: "STREAM_FAILED",
              backendAvailable: false,
            })
          );
        }
      };

      void sendStatus();
      const interval = setInterval(() => {
        void sendStatus();
      }, 4000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
