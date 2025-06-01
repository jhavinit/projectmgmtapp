/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { projectRouter } from "../../src/server/api/routers/project";
import { PrismaClient } from "@prisma/client";

// Mock summarizeWithHuggingFace if used in your router
vi.mock("../../src/server/utils/ai-summary-service", () => ({
    summarizeWithHuggingFace: vi.fn(() => Promise.resolve("summary result")),
}));

describe("projectRouter", () => {
    let dbMock: ReturnType<typeof mockDeep<PrismaClient>>;
    let ctx: { db: ReturnType<typeof mockDeep<PrismaClient>>; session: { user: { id: string }; expires: string } | null };

    beforeEach(() => {
        dbMock = mockDeep<PrismaClient>();
        ctx = { db: dbMock, session: { user: { id: "u1" }, expires: "" } };
        vi.clearAllMocks();
    });

    it("should get all projects assigned to the current user", async () => {
        const fakeProjects = [
            {
                id: "1",
                name: "Project 1",
                createdAt: new Date(),
                details: "Some details",
                summary: "Some summary",
                projectAssignments: [{ userId: "u1" }],
            },
        ];
        dbMock.project.findMany.mockResolvedValue(fakeProjects);
        const findMany = dbMock.project.findMany;

        const caller = projectRouter.createCaller(ctx);
        const result = await caller.getAll();

        expect(result).toEqual(fakeProjects);
        expect(findMany).toHaveBeenCalledWith({
            where: {
                projectAssignments: {
                    some: { userId: "u1" },
                },
            },
            orderBy: { createdAt: "desc" },
            include: {
                projectAssignments: { select: { userId: true } },
            },
        });
    });

    it("should generate a summary for a project", async () => {
        const { summarizeWithHuggingFace } = await import("../../src/server/utils/ai-summary-service");
        const input = { summary: "This is a long project description." };

        const caller = projectRouter.createCaller(ctx);
        const result = await caller.generateSummary(input);

        expect(result).toBe("summary result");
        expect(summarizeWithHuggingFace).toHaveBeenCalledWith(input.summary);
    });

    it("should create a new project and assign users", async () => {
        dbMock.project.create.mockResolvedValue({ id: "1", name: "Project X", createdAt: new Date(), details: "Details", summary: "" });
        dbMock.projectAssignment.createMany.mockResolvedValue({ count: 2 });

        const input = {
            name: "Project X",
            details: "Details",
            summary: "",
            userIds: ["u1", "u2"],
        };

        const caller = projectRouter.createCaller(ctx);
        const result = await caller.create(input);

        expect(result).toBe("Project created successfully");
        expect(dbMock.project.create).toHaveBeenCalledWith({
            data: {
                name: input.name,
                details: input.details,
                summary: input.summary ?? "",
            },
        });
        expect(dbMock.projectAssignment.createMany).toHaveBeenCalledWith({
            data: [
                { projectId: "1", userId: "u1", assignedAt: expect.any(Date), role: "member" },
                { projectId: "1", userId: "u2", assignedAt: expect.any(Date), role: "member" },
            ],
        });
    });

    it("should edit an existing project and update user assignments", async () => {
        dbMock.project.update.mockResolvedValue({
            id: "1",
            name: "Project Y",
            createdAt: new Date(),
            details: "Updated details",
            summary: "Updated summary"
        });
        dbMock.projectAssignment.deleteMany.mockResolvedValue({ count: 2 });
        dbMock.projectAssignment.createMany.mockResolvedValue({ count: 2 });

        const input = {
            id: "1",
            name: "Project Y",
            details: "Updated details",
            summary: "Updated summary",
            userIds: ["u1", "u3"],
        };

        const caller = projectRouter.createCaller(ctx);
        await caller.edit(input);

        expect(dbMock.project.update).toHaveBeenCalledWith({
            where: { id: input.id },
            data: {
                name: input.name,
                details: input.details,
                summary: input.summary ?? "",
            },
        });
        expect(dbMock.projectAssignment.deleteMany).toHaveBeenCalledWith({
            where: { projectId: input.id },
        });
        expect(dbMock.projectAssignment.createMany).toHaveBeenCalledWith({
            data: [
                { projectId: input.id, userId: "u1", assignedAt: expect.any(Date), role: "member" },
                { projectId: input.id, userId: "u3", assignedAt: expect.any(Date), role: "member" },
            ],
        });
    });

    it("should delete a project and its assignments", async () => {
        dbMock.projectAssignment.deleteMany.mockResolvedValue({ count: 2 });
        dbMock.project.delete.mockResolvedValue({
            id: "1",
            name: "Deleted Project",
            createdAt: new Date(),
            details: "Deleted project details",
            summary: null
        });

        const input = { id: "1" };

        const caller = projectRouter.createCaller(ctx);
        const result = await caller.delete(input);

        expect(result).toMatchObject({ id: "1" }); // <-- FIXED
        expect(dbMock.projectAssignment.deleteMany).toHaveBeenCalledWith({
            where: { projectId: input.id },
        });
        expect(dbMock.project.delete).toHaveBeenCalledWith({
            where: { id: input.id },
        });
    });

    it("should add a user to a project", async () => {
        dbMock.projectAssignment.create.mockResolvedValue({
            id: "pa1",
            projectId: "1",
            userId: "u2",
            assignedAt: new Date(),
            role: "admin"
        });

        const input = { projectId: "1", userId: "u2", role: "admin" };

        const caller = projectRouter.createCaller(ctx);
        const result = await caller.addUser(input);

        expect(result).toMatchObject({ id: "pa1" }); // <-- FIXED
        expect(dbMock.projectAssignment.create).toHaveBeenCalledWith({
            data: {
                projectId: input.projectId,
                userId: input.userId,
                assignedAt: expect.any(Date),
                role: input.role ?? "member",
            },
        });
    });

    it("should remove a user from a project", async () => {
        dbMock.projectAssignment.deleteMany.mockResolvedValue({ count: 1 });

        const input = { projectId: "1", userId: "u2" };

        const caller = projectRouter.createCaller(ctx);
        const result = await caller.removeUser(input);

        expect(result).toEqual({ count: 1 });
        expect(dbMock.projectAssignment.deleteMany).toHaveBeenCalledWith({
            where: {
                projectId: input.projectId,
                userId: input.userId,
            },
        });
    });
});