# AI Interview Assistant - Edge Computing Edition

## Motivation & Market Need
The job market is increasingly competitive, and candidates often struggle to practice technical and behavioral interviews effectively. Traditional interview prep platforms either rely on static question banks or send sensitive personal data (audio and video) to remote servers for processing, raising privacy concerns and incurring high server costs, which translates to expensive subscriptions for users. 

This project aims to democratize interview preparation by providing real-time, zero-latency feedback while ensuring maximum privacy. By moving the heavy lifting of AI processing to the client's device, we offer a scalable, private, and instantaneous interview practice environment.

## Pushing the Boundaries of Edge Computing
To achieve this, we pushed the boundaries of edge computing by integrating several high-intensity machine learning models directly into the **frontend**. Instead of relying on a costly and latency-prone backend for multimedia processing, the application uses the raw compute power of the user's browser:

- **Whisper**: For robust, real-time audio transcription natively in the browser.
- **Face & Landmark Detection**: To track the user's presence and facial expressions in real-time.
- **Custom-trained TensorFlow.js Model**: For nuanced emotion recognition, analyzing the candidate's confidence, stress levels, and engagement directly on-device.

## Project Frontend & Backend Architecture
### Frontend
The frontend is built with **React, TypeScript, and Vite**, bringing together advanced Web APIs and client-side ML models. It's responsible for capturing webcam and microphone inputs, running the inference models locally, managing the user interface, and orchestrating the entire interview flow. By keeping media processing on the frontend, we guarantee user privacy and eliminate network bottlenecks.

### Backend
The backend serves as a lightweight orchestration layer and LLM communication bridge. Because the frontend already digests the audio into text transcriptions and the video into emotional/landmark metadata, the backend only needs to receive minimal JSON payloads. It interfaces with external Large Language Models (LLMs) to generate dynamic interview questions and evaluate the candidate's responses based on the transcribed text and emotional cues, returning the feedback to the frontend.

## State Management with XState
Given the immense complexity of the application—navigating through webcam permissions, heavy model downloading and initialization, active conversational interview stages, and feedback generation—we utilized **XState** for robust state management. 

XState's state machines provide a determinist approach to handling the application lifecycle:
- **Predictable Transitions**: Ensuring the user cannot start an interview before all AI models are fully loaded and hardware permissions are granted.
- **Visualized Logic**: Making it easier to map out complex asynchronous operations cleanly, avoiding tangled and fragile `useEffect` hooks.
- **Resilient Architecture**: Handling network drops, hardware disconnections, or model loading errors gracefully with predefined explicit fallback states.
