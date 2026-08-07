import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("Smoke Test", () => {
  it("renders a simple React component", () => {
    render(React.createElement("div", null, "Hello Test"));
    expect(screen.getByText("Hello Test")).toBeInTheDocument();
  });
});
