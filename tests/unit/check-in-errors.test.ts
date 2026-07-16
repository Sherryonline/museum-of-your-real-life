import { describe, expect, it } from "vitest";

import { checkInErrorMessages, mapCheckInError } from "@/features/check-ins/errors";

describe("check-in errors", () => {
  it("maps known error codes to safe messages", () => {
    expect(mapCheckInError("CHECKIN_OUT_OF_RANGE")).toEqual({
      code: "CHECKIN_OUT_OF_RANGE",
      message: checkInErrorMessages.CHECKIN_OUT_OF_RANGE,
    });
  });

  it("ignores unknown internal codes", () => {
    expect(mapCheckInError("postgres detail leaked")).toBeNull();
  });
});
