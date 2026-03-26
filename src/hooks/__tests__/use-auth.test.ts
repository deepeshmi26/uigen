import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

const anonWorkWithMessages = {
  messages: [{ role: "user", content: "hello" }],
  fileSystemData: { "/App.jsx": "export default function App() {}" },
};

const existingProject = {
  id: "proj-123",
  name: "My Project",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createdProject = {
  id: "proj-new",
  name: "New Design",
  userId: "user-1",
  messages: "[]",
  data: "{}",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue(createdProject);
});

describe("useAuth — signIn", () => {
  it("returns isLoading=false initially", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  it("returns the failure result when credentials are invalid", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());
    let outcome: Awaited<ReturnType<typeof result.current.signIn>>;

    await act(async () => {
      outcome = await result.current.signIn("bad@example.com", "wrongpass");
    });

    expect(outcome!).toEqual({ success: false, error: "Invalid credentials" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("sets isLoading=true while the request is in flight, then false when done", async () => {
    let resolveSignIn!: (v: { success: boolean }) => void;
    mockSignInAction.mockReturnValue(
      new Promise((res) => { resolveSignIn = res; }) as any
    );

    const { result } = renderHook(() => useAuth());

    act(() => { result.current.signIn("user@example.com", "password123"); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => { resolveSignIn({ success: false }); });
    expect(result.current.isLoading).toBe(false);
  });

  it("redirects to the anonymous work project when anon work exists after sign-in", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(anonWorkWithMessages);
    mockCreateProject.mockResolvedValue({ ...createdProject, id: "anon-proj" });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("user@example.com", "password123"); });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: anonWorkWithMessages.messages,
        data: anonWorkWithMessages.fileSystemData,
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-proj");
    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  it("redirects to the most recent project when no anon work and projects exist", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("user@example.com", "password123"); });

    expect(mockPush).toHaveBeenCalledWith(`/${existingProject.id}`);
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it("creates a new project and redirects when no anon work and no existing projects", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([]);

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("user@example.com", "password123"); });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith(`/${createdProject.id}`);
  });

  it("skips post-sign-in flow entirely when sign-in fails", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "An error occurred during sign in" });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("user@example.com", "password123"); });

    expect(mockGetAnonWorkData).not.toHaveBeenCalled();
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("resets isLoading to false even when an error is thrown", async () => {
    mockSignInAction.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("user@example.com", "password123").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("ignores anon work when messages array is empty", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
    mockGetProjects.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("user@example.com", "password123"); });

    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(`/${existingProject.id}`);
  });
});

describe("useAuth — signUp", () => {
  it("returns the failure result when sign-up fails", async () => {
    mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());
    let outcome: Awaited<ReturnType<typeof result.current.signUp>>;

    await act(async () => {
      outcome = await result.current.signUp("existing@example.com", "password123");
    });

    expect(outcome!).toEqual({ success: false, error: "Email already registered" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to anonymous work project after successful sign-up", async () => {
    mockSignUpAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(anonWorkWithMessages);
    mockCreateProject.mockResolvedValue({ ...createdProject, id: "anon-proj" });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signUp("new@example.com", "password123"); });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: anonWorkWithMessages.messages })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-proj");
  });

  it("creates a new project when sign-up succeeds with no prior work", async () => {
    mockSignUpAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([]);

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signUp("new@example.com", "password123"); });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith(`/${createdProject.id}`);
  });

  it("resets isLoading to false even when an error is thrown", async () => {
    mockSignUpAction.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("new@example.com", "password123").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });
});
