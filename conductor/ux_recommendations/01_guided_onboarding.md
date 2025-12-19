# UX Improvement Option 1: The "Guided Onboarding" Experience

This option focuses on improving the experience for new users who might be overwhelmed by the density of the dashboard.

## Key Changes:

1.  **Guided First Research:** Instead of a single query input, create a multi-step "wizard" for the user's first research task.
    *   **Step 1: Define Topic:** The initial query.
    *   **Step 2: Scope (Optional):** Ask clarifying questions to narrow the scope, like "What specific aspects are you most interested in?"
    *   **Step 3: Agent Selection (Optional):** Allow users to choose from different agent configurations (e.g., "Quick Overview" vs. "Deep Dive").
    *   **Step 4: Review & Launch:** Show a summary of the research plan before starting.

2.  **Informative Empty State:** Before the first research is run, the dashboard panels should not be blank. Instead, they should contain:
    *   A brief explanation of what the panel does (e.g., "The Agent Graph will show how your AI agents collaborate in real-time.").
    *   A call to action that points to the research query input.

3.  **Contextual Help:**
    *   Add small `(?)` icons to each panel title.
    *   Clicking the icon would trigger a popover or modal with a more detailed explanation and a link to documentation if available.

## Impact:

*   **Reduces initial learning curve:** Makes the tool less intimidating for first-time users.
*   **Improves query quality:** Guides users to provide better, more specific queries.
*   **Increases user confidence:** Helps users understand what the tool is doing at each step.
