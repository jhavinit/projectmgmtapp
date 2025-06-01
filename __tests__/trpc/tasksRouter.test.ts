/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { taskRouter, TaskStatus, TaskPriority, TaskType } from "../../src/server/api/routers/taskRouter";
import { PrismaClient } from "@prisma/client";

describe("taskRouter", () => {
    let dbMock: ReturnType<typeof mockDeep<PrismaClient>>;
    let ctx: { db: ReturnType<typeof mockDeep<PrismaClient>>; session: { user: { id: string }; expires: string } | null };

    beforeEach(() => {
        dbMock = mockDeep<PrismaClient>();
        ctx = { db: dbMock, session: { user: { id: "u1" }, expires: "" } };
        vi.clearAllMocks();
    });

    it("should update the status of a task", async () => {
        dbMock.task.update.mockResolvedValue({
            id: "t1",
            title: "Sample Task",
            description: "Sample Description",
            status: TaskStatus.DONE,
            priority: TaskPriority.MEDIUM,
            startDate: new Date(),
            deadline: new Date(),
            tags: [],
            type: TaskType.FEATURE,
            projectId: "p1",
            assignedToId: "u2",
            createdById: "u1",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const input = { id: "t1", status: TaskStatus.DONE };
        const caller = taskRouter.createCaller(ctx);
        const result = await caller.updateStatus(input);

        expect(result).toMatchObject({ id: "t1", status: TaskStatus.DONE });
        expect(dbMock.task.update).toHaveBeenCalledWith({
            where: { id: input.id },
            data: { status: input.status },
        });
    });

    it("should get all tasks for a project with pagination", async () => {
        dbMock.task.findMany.mockResolvedValue([{
            id: "t1",
            title: "Sample Task",
            description: "Sample Description",
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            startDate: new Date(),
            deadline: new Date(),
            tags: [],
            type: TaskType.FEATURE,
            projectId: "p1",
            assignedToId: "u2",
            createdById: "u1",
            createdAt: new Date(),
            updatedAt: new Date(),
        }]);
        dbMock.task.count.mockResolvedValue(1);

        const input = {
            projectId: "p1",
            page: 1,
            limit: 10,
            type: TaskType.ALL,
            priority: TaskPriority.ALL,
            status: TaskStatus.ALL,
            skipPagination: false,
            search: "",
        };

        const caller = taskRouter.createCaller(ctx);
        const result = await caller.getAll(input);

        expect(result.tasks).toContainEqual(expect.objectContaining({ id: "t1" }));
        expect(result.totalPages).toBe(1);
        expect(result.currentPage).toBe(1);
        expect(dbMock.task.findMany).toHaveBeenCalled();
        expect(dbMock.task.count).toHaveBeenCalled();
    });

    it("should create a new task", async () => {
        dbMock.task.create.mockResolvedValue({
            id: "t2",
            title: "Task Title",
            description: "Task Description",
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            startDate: new Date(),
            deadline: new Date(),
            tags: ["urgent"],
            type: TaskType.FEATURE,
            projectId: "p1",
            assignedToId: "u2",
            createdById: "u1",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const input = {
            title: "Task Title",
            description: "Task Description",
            deadline: new Date(),
            priority: TaskPriority.HIGH,
            tags: ["urgent"],
            projectId: "p1",
            assignedToId: "u2",
            status: TaskStatus.TODO,
            type: TaskType.FEATURE,
        };

        const caller = taskRouter.createCaller(ctx);
        const result = await caller.create(input);

        expect(result).toMatchObject({ id: "t2" });
        expect(dbMock.task.create).toHaveBeenCalledWith({
            data: {
                title: input.title,
                description: input.description,
                deadline: input.deadline,
                priority: input.priority,
                tags: input.tags,
                projectId: input.projectId,
                assignedToId: input.assignedToId,
                createdById: ctx.session?.user.id,
                status: input.status,
                type: input.type,
            },
        });
    });

    it("should update an existing task", async () => {
        dbMock.task.update.mockResolvedValue({
            id: "t3",
            title: "Updated Title",
            description: "Updated Description",
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.MEDIUM,
            startDate: new Date(),
            deadline: new Date(),
            tags: ["backend"],
            type: TaskType.IMPROVEMENT,
            projectId: "p1",
            assignedToId: "u3",
            createdById: "u1",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const input = {
            id: "t3",
            title: "Updated Title",
            description: "Updated Description",
            status: TaskStatus.IN_PROGRESS,
            deadline: new Date(),
            priority: TaskPriority.MEDIUM,
            tags: ["backend"],
            assignedToId: "u3",
            type: TaskType.IMPROVEMENT,
        };

        const caller = taskRouter.createCaller(ctx);
        const result = await caller.update(input);

        expect(result).toMatchObject({ id: "t3" });
        expect(dbMock.task.update).toHaveBeenCalledWith({
            where: { id: input.id },
            data: {
                title: input.title,
                description: input.description,
                status: input.status,
                deadline: input.deadline,
                priority: input.priority,
                tags: input.tags,
                assignedToId: input.assignedToId,
                type: input.type,
            },
        });
    });

    it("should delete a task by id", async () => {
        dbMock.task.delete.mockResolvedValue({
            id: "t4",
            title: "Deleted Task",
            description: "Deleted task description",
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            startDate: new Date(),
            deadline: new Date(),
            tags: [],
            type: TaskType.FEATURE,
            projectId: "p1",
            assignedToId: "u2",
            createdById: "u1",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const input = { id: "t4" };

        const caller = taskRouter.createCaller(ctx);
        const result = await caller.delete(input);

        expect(result).toMatchObject({ id: "t4" });
        expect(dbMock.task.delete).toHaveBeenCalledWith({
            where: { id: input.id },
        });
    });
});