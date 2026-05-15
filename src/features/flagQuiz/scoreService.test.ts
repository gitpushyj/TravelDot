const mockRpc = jest.fn();

jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: (...a: unknown[]) => mockRpc(...a),
  },
}));

import {
  fetchLeaderboard,
  fetchMyQuizScore,
  fetchMyRank,
  submitQuizScore,
} from "./scoreService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchMyQuizScore", () => {
  it("이번 주 본인 점수 RPC 결과를 반환한다", async () => {
    mockRpc.mockResolvedValue({
      data: [{ best_score: 12, last_score: 7 }],
      error: null,
    });
    const out = await fetchMyQuizScore();
    expect(mockRpc).toHaveBeenCalledWith("get_my_flag_quiz_score");
    expect(out).toEqual({ bestScore: 12, lastScore: 7 });
  });

  it("행이 없거나 에러면 null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    expect(await fetchMyQuizScore()).toBeNull();
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await fetchMyQuizScore()).toBeNull();
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

describe("fetchLeaderboard", () => {
  it("RPC 결과를 매핑한 배열을 반환한다", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { rank: 1, best_score: 9, nickname: "a", home_country_code: "KR", user_id: "u1" },
        { rank: 2, best_score: 7, nickname: null, home_country_code: null, user_id: "u2" },
      ],
      error: null,
    });
    const out = await fetchLeaderboard(100);
    expect(mockRpc).toHaveBeenCalledWith("get_flag_quiz_leaderboard", { p_limit: 100 });
    expect(out).toEqual([
      { rank: 1, bestScore: 9, nickname: "a", homeCountryCode: "KR", userId: "u1" },
      { rank: 2, bestScore: 7, nickname: null, homeCountryCode: null, userId: "u2" },
    ]);
  });

  it("에러면 빈 배열", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await fetchLeaderboard(10)).toEqual([]);
  });
});

describe("fetchMyRank", () => {
  it("본인 등수 RPC 결과를 반환한다", async () => {
    mockRpc.mockResolvedValue({ data: [{ rank: 42, best_score: 5 }], error: null });
    expect(await fetchMyRank()).toEqual({ rank: 42, bestScore: 5 });
  });

  it("행이 없으면 null", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    expect(await fetchMyRank()).toBeNull();
  });
});
