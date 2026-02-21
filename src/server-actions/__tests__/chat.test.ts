import { describe, it, expect, vi } from "vitest";
import {
  sendMessage,
  getMessages,
  getMessageById,
  editMessage,
  deleteMessage,
  markConversationAsRead,
} from "../chat";

// mock the supabaseAdmin client
vi.mock("@/lib/supabaseAdmin", () => {
  return {
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: vi.fn(),
    },
  };
});

// Also mock auth to return invalid session by default
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe("message server actions - validation", () => {
  it("sendMessage should reject missing conversationId or content", async () => {
    let res = await sendMessage("", "hello");
    expect(res.success).toBe(false);
    res = await sendMessage("conv", "");
    expect(res.success).toBe(false);
  });

  it("getMessages should reject missing conversationId", async () => {
    const res = await getMessages("");
    expect(res.success).toBe(false);
  });

  it("getMessageById should reject missing id", async () => {
    const res = await getMessageById("");
    expect(res.success).toBe(false);
  });

  it("editMessage should reject missing params", async () => {
    let res = await editMessage("", "new");
    expect(res.success).toBe(false);
    res = await editMessage("id", "");
    expect(res.success).toBe(false);
  });

  it("deleteMessage should reject missing id", async () => {
    const res = await deleteMessage("");
    expect(res.success).toBe(false);
  });

  it("markConversationAsRead should reject missing conversationId", async () => {
    const res = await markConversationAsRead("");
    expect(res.success).toBe(false);
  });
});
