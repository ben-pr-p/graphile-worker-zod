# graphile-worker-zod

A group of simple utilities that make working with the already joyous [graphile-worker](https://github.com/graphile/worker)
that much easier and safer.

It adds typed and validated tasks and addJob functions.

# Usage

```typescript
// worker.ts
import { createTask, createTaskList, AddJobFn } from 'graphile-worker-zod';
import { run, TaskList } from 'graphile-worker';
import { z } from 'zod'

const sendEmail = createTask(
  z.object({
    email: z.string().email(),
  }),
  async (payload, jobHelpers) => {
    // payload is typed as { email: string }
    // send email
  }
)

const taskList = {
  sendEmail,
} as const; // you need this as const declaration!!!

let runner: Runner;

export const startWorker = async () => {
  runner = await run({
    pgPool: pool // definition not shown,
    taskList: taskList as TaskList // cast required because type has extra info graphile-worker doesn't want
  })
}

export const addJob: AddJobFn<typeof TaskList> = async (taskName, payload) => {
  if (!runner) {
    throw new Error('Add job called before worker started');
  }

  return runner.addJob(taskName, payload);
}
```

Then, when you call `startWorker()` in some application start up script, you can get a fully typed `addJob` function and
jobs that validate their own inputs before your task code executes.

# Motivation

It's better for a job to fail than for unknown behavior to happen.

Although with the typed `addJob` function it's relatively easy to ensure your input is correct, it's still possible 
to queue jobs incorrectly, especially when using the `graphile_worker.add_job` function in the database.

# Note

Note that there is no Zod based validation on the `addJob` function itself. This is just an opinion: it's better
for whatever data is recorded in the job payload to be written, and for the job to fail, than for the job to not
be queued.
