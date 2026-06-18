/**
 * use-discord-webhook.ts
 *
 * Small reusable hook to send messages to a Discord webhook URL from the browser.
 * - Accepts a default webhook URL when creating the hook
 * - Exposes `send(payload, webhookUrl?)` which returns the fetch Response
 * - Handles simple rate-limit (429) retries using `retry_after` from Discord
 * - Validates content length to Discord's 2000-character limit for `content`
 */

export type DiscordWebhookPayload = {
    content?: string;
  };
  
  type UseDiscordWebhookReturn = {
    send: (payload: DiscordWebhookPayload) => Promise<Response>;
  };
  
  export function useDiscordWebhook(): UseDiscordWebhookReturn {
    const MAX_CONTENT_LENGTH = 2000;
    const MAX_RETRIES = 3;
  
    async function wait(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }
  
    async function send(payload: DiscordWebhookPayload): Promise<Response> {
      // Read Vite env var. Keep it required so secrets aren't embedded elsewhere.
      const url = import.meta.env.VITE_DISCORD_WEBHOOK as string | "";
      if (!url)
        throw new Error(
          "No Discord webhook URL found in VITE_DISCORD_WEBHOOK. Add it to your .env and restart the dev server."
        );
  
      if (payload.content && typeof payload.content === "string" && payload.content.length > MAX_CONTENT_LENGTH) {
        // Truncate safely and append ellipsis
        payload = { ...payload, content: payload.content.slice(0, MAX_CONTENT_LENGTH - 1) + "…" };
      }
  
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        attempt += 1;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
  
        if (res.ok) return res;
  
        // Rate-limited, try again after `retry_after` (Discord returns JSON with retry_after in ms)
        if (res.status === 429) {
          try {
            const json = await res.json();
            const retryAfter = typeof json?.retry_after === "number" ? json.retry_after : 1000;
            // discord's retry_after is milliseconds in many contexts; safely wait that amount
            await wait(retryAfter + 100);
            continue;
          } catch (err) {
            // If parsing fails, wait a small backoff and retry
            await wait(1000 * attempt);
            continue;
          }
        }
  
        // For other errors, throw with status and body text when possible
        let text = "";
        try {
          text = await res.text();
        } catch (e) {
          /* ignore */
        }
        throw new Error(`Discord webhook error: ${res.status} ${res.statusText} ${text}`);
      }
  
      throw new Error("Exceeded max retries for Discord webhook");
    }
  
    return { send };
  }
  
  export default useDiscordWebhook;
  