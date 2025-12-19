# GEMINI.md

This file provides a comprehensive overview of the `learningclaudeagents` project, its structure, and how to interact with it.

## Project Overview

This project is a "Deep Research Agent" that uses the Anthropic Claude Agent SDK to conduct research on a given topic. The project is composed of a Next.js frontend and a backend that communicates with the Claude agent.

The main technologies used in this project are:

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Backend:** Node.js (via Next.js API routes)
*   **AI:** Anthropic Claude Agent SDK

## Project Structure

The project is organized into the following main directories:

*   `conductor/`: Contains project management documentation, including tracks, plans, and technical specifications.
*   `deep-research-agent/`: A Next.js application that contains the core functionality of the research agent.
*   `main.py`: A Python script (currently a placeholder).

### Key Files and Directories

#### Conductor (`conductor/`)
*   `tracks/`: Contains specific development tracks (e.g., `synthesis_improvement_20251219`).
*   `ux_recommendations/`: specialized UX documents.
*   `tech-stack.md`: Documentation of the technology stack.
*   `workflow.md`: Development workflow guidelines.

#### Deep Research Agent (`deep-research-agent/`)
*   `src/app/page.tsx`: The main user interface.
*   `src/app/api/research/route.ts`: Backend API route for the Claude agent.
*   `src/components/`: specialized UI components (agents, dashboard, metrics, etc.).
*   `src/hooks/`: Custom React hooks (e.g., `useResearch.ts`, `useAgentGraph.ts`).
*   `src/lib/`: Utility libraries and agent logic.
*   `files/`: Storage for generated reports and research notes.

## Building and Running

To run the project, you need to have Node.js and npm (or yarn/pnpm/bun) installed.

1.  Navigate to the `deep-research-agent` directory:
    ```bash
    cd deep-research-agent
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
This will start the Next.js application on `http://localhost:3000`.

## Development Conventions

The project follows the standard conventions for a Next.js application. The code is written in TypeScript and styled with Tailwind CSS. The frontend is built with React and uses hooks to manage the application's state. The backend is implemented as a Next.js API route.

Refer to `conductor/code_styleguides/` for detailed style guides on General coding, HTML/CSS, JavaScript, and TypeScript.