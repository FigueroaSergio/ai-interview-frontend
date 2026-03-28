import { createMachine, assign, fromPromise } from "xstate";
import {
  checkCompleteness,
  getFinalEvaluation,
  getIntakeAI,
  getInterviewQuestion,
} from "./ai";
export const Roles = { Ai: "assistant", User: "user" };

export type Roles = (typeof Roles)[keyof typeof Roles];
export type Transcript = {
  role: Roles;
  content: string;
};

export type ContextInterview = {
  role: string;
  resume: string;
  transcript: Transcript[];
  questionCount: number;
  maxQuestions: number;
  evaluation: string;
  isComplete: boolean;
  errorMessage: string;
  retryingState: string;
};
export const interviewMachine = createMachine({
  id: "aiInterview",
  initial: "gatheringInfo", // Start by talking to the user
  context: {
    role: "",
    resume: "",
    transcript: [] as Transcript[],
    questionCount: 0,
    maxQuestions: 2,
    evaluation: "",
    isComplete: false,
    errorMessage: "",
    retryingState: "", // Keep track of where we fell over
  } as ContextInterview,
  states: {
    gatheringInfo: {
      initial: "aiAsking",
      states: {
        aiAsking: {
          invoke: {
            src: fromPromise(({ input }) => getIntakeAI(input.context)),
            input: ({ context }) => ({ context }),
            onDone: {
              target: "userResponding",
              actions: assign({
                transcript: ({ context, event }) => [
                  ...context.transcript,
                  { role: Roles.Ai, content: event.output },
                ],
              }),
            },
            onError: {
              target: "#aiInterview.error",
              actions: assign({
                errorMessage: "Intake failed.",
                retryingState: "gatheringInfo",
              }),
            },
          },
        },
        userResponding: {
          on: {
            SUBMIT: {
              target: "verifying",
              actions: assign({
                transcript: ({ context, event }) => [
                  ...context.transcript,
                  { role: Roles.User, content: event.payload },
                ],
              }),
            },
          },
        },
        verifying: {
          invoke: {
            src: fromPromise(({ input }) =>
              checkCompleteness(input.context.transcript),
            ),
            input: ({ context }) => ({ context }),
            onDone: [
              {
                target: "#aiInterview.interviewing",
                guard: ({ event }) => event.output.isComplete,
                actions: assign({
                  role: ({ event }) => event.output.extractedRole,
                  resume: ({ event }) => event.output.extractedResume,
                }),
              },
              { target: "aiAsking" },
            ],
            onError: {
              target: "#aiInterview.error",
              actions: assign({
                errorMessage: "Verification failed.",
                retryingState: "gatheringInfo", // Go back to start of intake
              }),
            },
          },
        },
      },
    },
    interviewing: {
      initial: "aiThinking",
      states: {
        aiThinking: {
          invoke: {
            src: fromPromise(({ input }) =>
              getInterviewQuestion(input.context),
            ),
            input: ({ context }) => ({ context }),
            onDone: {
              target: "userAnswering",
              actions: assign({
                transcript: ({ context, event }) => [
                  ...context.transcript,
                  { role: "ai", content: event.output },
                ],
              }),
            },
            onError: {
              target: "#aiInterview.error",
              actions: assign({
                errorMessage: "Question generation failed.",
                retryingState: "interviewing",
              }),
            },
          },
        },
        userAnswering: {
          on: {
            SUBMIT: [
              {
                guard: ({ context }) =>
                  context.questionCount <= context.maxQuestions,
                target: "aiThinking",
                actions: assign({
                  questionCount: ({ context }) => context.questionCount + 1,
                  transcript: ({ context, event }) => [
                    ...context.transcript,
                    { role: "user", content: event.payload },
                  ],
                }),
              },
              {
                target: "#aiInterview.evaluating",
                actions: assign({
                  transcript: ({ context, event }) => [
                    ...context.transcript,
                    { role: "user", content: event.payload },
                  ],
                }),
              },
            ],
          },
        },
      },
    },
    evaluating: {
      invoke: {
        src: fromPromise(({ input }) => getFinalEvaluation(input.context)),
        input: ({ context }) => ({ context }),
        onDone: {
          target: "completed",
          actions: assign({ evaluation: ({ event }) => event.output }),
        },
        onError: {
          target: "#aiInterview.error",
          actions: assign({
            errorMessage: "Final evaluation failed.",
            retryingState: "evaluating",
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: [
          {
            guard: ({ context }) => context.retryingState === "gatheringInfo",
            target: "gatheringInfo",
          },
          {
            guard: ({ context }) => context.retryingState === "interviewing",
            target: "interviewing",
          },
          {
            guard: ({ context }) => context.retryingState === "evaluating",
            target: "evaluating",
          },
          { target: "gatheringInfo" }, // Fallback
        ],
      },
    },
    completed: { type: "final" },
  },
});
