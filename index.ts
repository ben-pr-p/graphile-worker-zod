import { JobHelpers, Task, Runner, Job } from "graphile-worker";
import { z, ZodSchema } from "zod";

export type TypedTask<Payload, Return> = (
  payload: Payload,
  helpers: JobHelpers
) => Promise<Return>;

export const createTask = <ZodType extends ZodSchema>(
  schema: ZodType,
  task: TypedTask<z.infer<ZodType>, void>
) => {
  const wrappingTask: Task = async (payload, helpers) => {
    const validatedPayload = schema.parse(payload);
    return await task(validatedPayload, helpers);
  };

  return wrappingTask as TypedTask<z.infer<ZodType>, void>;
};

type GetTaskList<TaskListType> = () => TaskListType;

type AddTaskToZodTaskList<
  PreviousTaskList,
  Name extends string,
  Payload,
  Return
> = PreviousTaskList & Record<Name, TypedTask<Payload, Return>>;

type AddTaskFn<PreviousTaskList> = <Name extends string, Payload, Return>(
  name: Name,
  task: TypedTask<Payload, Return>
) => {
  addTask: AddTaskFn<
    AddTaskToZodTaskList<PreviousTaskList, Name, Payload, Return>
  >;
  getTaskList: GetTaskList<
    AddTaskToZodTaskList<PreviousTaskList, Name, Payload, Return>
  >;
};

export const createTaskList = () => {
  const taskList: Record<string, TypedTask<any, any>> = {};

  const getTaskList = () => taskList;

  const addTask = <Payload, Return>(
    name: string,
    task: TypedTask<Payload, Return>
  ) => {
    taskList[name] = task;
    return { addTask, getTaskList };
  };

  return { addTask: addTask as AddTaskFn<{}>, getTaskList };
};

type TaskNamePayloadMaps<
  TaskListType extends Record<string, TypedTask<any, any>>
> = {
  [Name in keyof TaskListType]: Parameters<TaskListType[Name]>[0];
};

export type AddJobFn<TaskListType extends Record<string, TypedTask<any, any>>> =
  <Name extends keyof TaskListType>(
    name: Name,
    payload: TaskNamePayloadMaps<TaskListType>[Name]
  ) => Promise<Job>;
