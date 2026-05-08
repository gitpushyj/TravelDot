import { parseAssistantText } from "./parseAssistantText";

describe("parseAssistantText", () => {
  test("plain text → text only, no images", () => {
    const out = parseAssistantText("그냥 인사야 안녕");
    expect(out.text).toBe("그냥 인사야 안녕");
    expect(out.imageUrls).toEqual([]);
  });

  test("extracts https markdown image, removes token from text", () => {
    const out = parseAssistantText(
      "교토 가을 ![autumn](https://example.com/kyoto.jpg) 진짜 좋아"
    );
    expect(out.imageUrls).toEqual(["https://example.com/kyoto.jpg"]);
    expect(out.text).toBe("교토 가을  진짜 좋아");
  });

  test("ignores http (non-https)", () => {
    const out = parseAssistantText("![x](http://insecure.example/a.jpg)");
    expect(out.imageUrls).toEqual([]);
  });

  test("max 4 images, extras ignored from collection", () => {
    const md = Array.from({ length: 6 })
      .map((_, i) => `![n${i}](https://h.example/${i}.jpg)`)
      .join(" ");
    const out = parseAssistantText(md);
    expect(out.imageUrls).toHaveLength(4);
  });

  test("dedupes same URL", () => {
    const out = parseAssistantText(
      "![a](https://x.example/a.jpg) ![b](https://x.example/a.jpg)"
    );
    expect(out.imageUrls).toEqual(["https://x.example/a.jpg"]);
  });

  test("malformed markdown ignored", () => {
    const out = parseAssistantText("![alt(https://x.example/a.jpg)");
    expect(out.imageUrls).toEqual([]);
    expect(out.text).toContain("![alt(https://x.example/a.jpg)");
  });

  test("trims excessive whitespace from text after stripping markdown", () => {
    const out = parseAssistantText(
      "사진 ![x](https://h.example/a.jpg)\n\n\n\n잘 봐"
    );
    expect(out.text).toBe("사진 \n\n잘 봐");
  });
});
