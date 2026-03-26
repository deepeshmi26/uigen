import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

test("shows 'Creating App.jsx' for str_replace_editor create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing Card.jsx' for str_replace_editor str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/components/Card.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/utils.ts" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("shows 'Reading utils.ts' for str_replace_editor view command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/lib/utils.ts" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("shows 'Undoing edit to' for str_replace_editor undo_edit command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Undoing edit to App.jsx")).toBeDefined();
});

test("shows 'Renaming old.jsx' for file_manager rename command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/old.jsx", new_path: "/new.jsx" }}
      state="result"
      result={{ success: true }}
    />
  );
  expect(screen.getByText("Renaming old.jsx")).toBeDefined();
});

test("shows 'Deleting temp.jsx' for file_manager delete command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/temp.jsx" }}
      state="result"
      result={{ success: true }}
    />
  );
  expect(screen.getByText("Deleting temp.jsx")).toBeDefined();
});

test("shows green dot when state is result with a result value", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is call (in-progress)", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is result but result is undefined", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result={undefined}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("falls back gracefully for unknown tool names", () => {
  render(
    <ToolCallBadge
      toolName="unknown_tool"
      args={{}}
      state="result"
      result="done"
    />
  );
  expect(screen.getByText("Unknown Tool")).toBeDefined();
});
