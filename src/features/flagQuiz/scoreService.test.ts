const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn((..._a: unknown[]) => ({ select: mockSelect }));
const mockRpc = jest.fn();

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: (...a: unknown[]) => mockFrom(...a),
    rpc: (...a: unknown[]) => mockRpc(...a),
  },
}));

import { fetchMyQuizScore, submitQuizScore } from "./scoreService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchMyQuizScore", () => {
  it("행이 있으면 best/last를 반환한다", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { best_score: 12, last_score: 7 }, error: null });
    const out = await fetchMyQuizScore("user-1");
    expect(mockFrom).toHaveBeenCalledWith("flag_quiz_scores");
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(out).toEqual({ bestScore: 12, lastScore: 7 });
  });

  it("행이 없거나 에러면 null", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await fetchMyQuizScore("user-1")).toBeNull();
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await fetchMyQuizScore("user-1")).toBeNull();
  });
});

describe("submitQuizScore", () => {
  it("RPC submit_flag_quiz_score를 점수와 함께 호출하고 갱신된 값을 반환한다", async () => {
    mockRpc.mockResolvedValue({
      data: [{ best_score: 15, last_score: 15 }],
      error: null,
    });
    const out = await submitQuizScore(15);
    expect(mockRpc).toHaveBeenCalledWith("submit_flag_quiz_score", { p_score: 15 });
    expect(out).toEqual({ bestScore: 15, lastScore: 15 });
  });

  it("에러면 null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await submitQuizScore(15)).toBeNull();
  });
});
