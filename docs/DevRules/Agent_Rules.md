User preferences

User is INTJ and Capricorn and aspergers.  20+ years corporate M&A and PE lawyer,  first time founder with 0 coding knowledge but keen to learn.  Needs handholding with technical coding stuff.  Has strong preference of optimised, beautiful and dopaminergic UI/UX and architectural solutions

General reminders

```markdown
- Always prioritize using native Windows command line commands (e.g., 'md', 'del') when operating on a Windows system, and only fall back to Python or other methods if native commands fail or are insufficient.
- Always use Windows commands for shell operations.
- User instructed me to never use the `git clean -fdx` command again as it is too destructive and can remove important untracked files and directories like `node_modules` or build outputs.
```

## Rule #1

don't be lazy

## Rule #2

At the start of a chat session, locate and read through DEVELOPMENT_GUIDELINES.md, remember it, and follow it to the extent practicable in that session's work. no need to re-read once commited to context memory. DO NOT modify this document without my approval.

## Rule #3

Any time i ask you to follow CSS Protocol, adhere to the following:

# Rule: Systematic CSS Debugging to Avoid Deadends

**Purpose:** Establish systematic approach to CSS debugging to reach solutions faster

## The CSS Debugging Protocol

When facing CSS styling issues, follow this exact sequence:

### 3.1. INSPECT FIRST, CODE SECOND

**Before writing any CSS:**

- Create browser debug script to inspect DOM structure
- Check computed styles on target elements
- Verify which elements are actually visible/rendered
- Identify all classes applied to target elements

### 3.2. IDENTIFY THE REAL PROBLEM

**Root cause analysis:**

- Count how many elements match your selector (expected vs actual)
- Check if mobile/desktop elements are both rendered simultaneously
- Verify media queries are working as expected
- Check CSS specificity conflicts

### 3.3. VERIFY SELECTOR TARGETING

**Before increasing specificity:**

- Ensure selectors target only intended elements
- Check for duplicate elements (mobile + desktop)
- Verify parent container structure matches expectations
- Test selectors in browser console first

### 3.4. SYSTEMATIC APPROACH CHECKLIST

### For Layout/Responsive Issues:

- [ ]  **DOM Inspection**: How many elements match the selector?
- [ ]  **Visibility Check**: Which elements are actually visible?
- [ ]  **Media Query Test**: Are breakpoints working correctly?
- [ ]  **Class Verification**: Do elements have expected classes?
- [ ]  **Specificity Check**: What CSS rules are actually being applied?

### For Styling Issues:

- [ ]  **Computed Styles**: What are the actual computed values?
- [ ]  **CSS Cascade**: Which rules are overriding others?
- [ ]  **Theme Conflicts**: Are theme-specific rules interfering?
- [ ]  **Selector Precision**: Are we targeting exactly what we want?

### 3.5. DEBUGGING SCRIPT TEMPLATE

Always create a debug script like this:

```jsx
// Quick CSS Debug Script
console.log('🔍 CSS DEBUG: [Issue Description]');

// 1. Find target elements
const elements = document.querySelectorAll('[your-selector]');
console.log(`Found ${elements.length} elements (expected: X)`);

// 2. Check visibility
elements.forEach((el, i) => {
  console.log(`Element ${i + 1}:`, {
    visible: el.offsetParent !== null,
    classes: el.className,
    computedStyle: window.getComputedStyle(el)['your-property']
  });
});

// 3. Check breakpoints
console.log('Window width:', window.innerWidth);
console.log('Desktop view:', window.innerWidth >= 1024);

// 4. Test your selector
const testSelector = document.querySelectorAll('.your-intended-selector');
console.log(`Your selector matches: ${testSelector.length} elements`);

```

### 3.6. COMMON DEADEND PATTERNS TO AVOID

### ❌ **Don't Do This:**

- Write CSS without knowing DOM structure
- Increase specificity without understanding why it's not working
- Assume mobile/desktop elements are mutually exclusive
- Skip checking if elements actually exist

### ✅ **Do This Instead:**

- Inspect DOM first, then write targeted CSS
- Understand why current CSS doesn't work before fixing
- Verify element visibility and expected count
- Test selectors in browser console before implementing

### 3.7. ESCALATION TRIGGERS

If any of these occur, STOP and debug:

- CSS changes have no visual effect
- Unexpected number of matching elements
- Mobile styles applying on desktop (or vice versa)
- High specificity (!important) needed to override

### 3.8. SUCCESS METRICS

A good CSS fix should:

- Target exactly the intended elements
- Use minimal specificity necessary
- Work across all relevant breakpoints
- Not require debugging multiple attempts

## Example Application

**Issue:** Desktop input panels show wrong border-radius

**Wrong Approach:** Increase CSS specificity without investigation

**Right Approach:**

1. Debug script reveals 4 input panels instead of 2
2. Discover mobile + desktop panels both render simultaneously
3. Target only desktop panels with precise selector
4. Success in first attempt

## Integration with Development

This rule should be applied when:

- Any CSS styling issue occurs
- Layout changes don't work as expected
- Responsive design problems arise
- Theme conflicts appear

**Time Investment:** 5-10 minutes debugging saves 30-60 minutes of trial and error.

## Rule #4

ignore any files with .ignore suffix, except don't ignore for purposes of syncing to github (i.e. still sync them)

## Rule #5: File / Git Naming Protocol

When creating files, git commits, branches, tags etc, follow the naming protocol below:

1. **Format**: `YYYYMMDD_File/ActionType_[A-Z]_DescriptiveSummary` 
    - `A` = First file/commit/branch/tag etc of day of that type
    - `B` = Second file/commit/branch/tag etc of day of that type
    - Continue alphabetically as needed
2. **Annotation**: Always use annotated tags (`a`) with `m` describing changes
3. **Examples**:
    - `20250715_REPORT_A_OcrEngine.tsx_refactor.md`
    - `20250715_TAG_F_Desktop_mobile_view_switch_fix`
    - `20250715_COMMIT_B_Fixed_database_integration`

## Rule #6: "INP" Workflow

When you are asked to "INP" an issue / problem, please initiate the following workflow:

6.1. investigate the issue / problem thoroughly, including tracing through all relevant user flows code flows, variables and dependencies;
6.2. if helpful, check relevant git history;
6.3. provide an accurate and grounded diagnosis of the fundamental root cause(s) of the issue / problem;
6.4. launch an independent expert code-review architect sub-agent to review the diagnoses;
6.5. summarise the reviewed (and, if necessary, corrected) diagnosis for me in concise, low-technical terms;
6.6. propose fix plans that are targeted, minimal, surgical and non-regressive.  ALWAYS prioritise simplest and most elegant solutions. Keep the big picture in mind.  Avoid overthinking or overengineering unless unavoidable.;
6.7. launch an independent expert code-review architect sub-agent to review the plans;
6.8. summarise the reviewed (and, if necessary, corrected) fix plans for me in concise, low-technical terms;
6.9. draft the diagnosis and fix plans into a task list that a coding agent can work against and update, export it in a .md in "\docs\Sprint_Plans_WIP”, following the YYYYMMDD-[descriptive-name].md convention.
6.10. DON’T CODE YET.
6.11. DON’T BREAK ANYTHING.

## Rule #7

Single Sprint Documentation Protocol

When working on features during a sprint (identified by YYYYMMDD date prefix):

1. Single Source of Truth: Always maintain ONE central planning document per sprint (e.g., 20250709_Plan_ModularExperimentalLayout.md) that serves as the authoritative source for all feature status, progress, and implementation details.
2. No Piecemeal Documentation: Do NOT create separate individual documentation files for each bug fix, enhancement, or feature implementation during active development. Instead, update the central planning document with:
• Status changes in the progress tracking section
• Implementation details in the relevant feature sections
• Completion notes with key accomplishments
3. Archive Management: If individual documentation files are created during development (for detailed investigation or complex implementations), immediately consolidate their content into the central document and move the individual files to a [YYYYMMDD]_sprint archive folder to maintain a clean documentation structure.
4. Update Central Document: Always update the central planning document's progress tracking, status summaries, and next priority sections when features are completed or status changes occur.
5. Documentation Location: Active sprint planning documents should normally live in `docs/Sprint_Plans_WIP/`. Once a sprint is completed, move or mirror the authoritative final sprint document into `docs/Sprint_Plans_Completed/` if appropriate. Use other `/docs/**` subfolders only when a document is not serving as the active sprint source of truth.
6. Execution Prompt At Top: Start the sprint document with a short coding-agent execution prompt that tells the agent how to use the file, what section to read first, and what not to re-implement.
7. Task Tracker Required: Every active sprint document must contain a dedicated task tracker section with stable task IDs and explicit statuses. Do not rely on loose bullet lists alone.
8. Task ID Convention: Use stable grouped task IDs such as:
• `ABC-MVP-01`, `ABC-MVP-02` for core implementation
• `ABC-UX-01`, `ABC-UX-02` for UX/polish work
• `ABC-QA-01`, `ABC-QA-02` for verification work
Use a short feature prefix that remains stable throughout the sprint.
9. Status Discipline: Each actionable task must be marked with a clear status such as `Completed`, `Outstanding`, or `Blocked`. Update statuses in place rather than duplicating the same task elsewhere in the doc.
10. Separation Of Completed vs Outstanding Work: The sprint document must make it easy for a new agent to distinguish what is already done from what remains to be done. If part of the sprint has already shipped, reflect that directly in the task tracker and summary sections.
11. Separate Execution Sections When Needed: If the sprint evolves from MVP build-out to polish/refinement, keep one central document but add clearly separated execution sections, and explicitly map them to the relevant task ID groups.
12. Naming Cleanup Requirement: When a feature is renamed mid-sprint, update the central sprint document so the narrative sections reflect the approved current wording. If an old name remains, it should be only where historically or operationally necessary, such as a rename task description.
13. QA Tracking Requirement: Include explicit QA tasks in the task tracker and mark them complete only after external/manual verification has actually occurred.
14. Agent Instruction Style: The central sprint document should be executable by reference. A future agent should be able to act on instructions like “execute this md” or “complete EWC-UX-01 to EWC-UX-07” without ambiguity.

This approach ensures a single authoritative source of truth while preserving detailed implementation history in organized archives.

## Rule #8

when creating new .md documentation, except for regular github docs, save all docs under the /Docs folder heirarchy (or as i othewise specify)

## Rule #9

DO NOT start development server in chat. when you want to run development server, do not "npm run dev" in the chat - instead ask me to run it externally, and tell me what you need to see / check and I will do so

## Rule #10

RULE: Collaborative Problem-Solving with user (Kai)

Working Style Observations:
• Prefers thorough investigation over quick fixes ("pls INP" = investigate thoroughly, trace code flows, create solutions, don't code yet)
• Values systematic troubleshooting that follows evidence rather than assumptions
• Appreciates detailed technical explanations of root causes and solutions
• Expects comprehensive documentation of milestones and fixes
• Uses concise communication style but expects detailed technical depth in responses
• Trusts the investigation process but wants implementation only after proper analysis

Optimal Collaboration Approach:

1. When given "INP" instruction: Conduct thorough investigation first, trace through all relevant code flows, check git history if helpful, propose multiple solutions prioritizing simplest/most elegant, and explicitly ask before implementing
2. Problem-solving methodology: Follow evidence systematically, use debugging tools and testing to verify hypotheses, explain technical root causes clearly, and document the complete problem→investigation→solution chain
3. Implementation style: Make targeted, minimal changes that preserve existing functionality, provide clear before/after explanations, include proper error handling and rollback options
4. Communication: Be concise in status updates but comprehensive in technical explanations, ask clarifying questions only when truly necessary for core functionality, and provide complete context for technical decisions
5. Documentation: Always document significant fixes with both technical details and user impact, update changelogs and create milestone documents, and include future testing recommendations

Key Success Factors:
• Systematic investigation beats quick assumptions
• Evidence-driven debugging with proper tooling
• Minimal, targeted fixes that preserve existing functionality

• Comprehensive documentation for future reference
• Clear technical explanations of root causes and solutions

This rule emphasizes Kai's preference for thorough, systematic problem-solving with comprehensive documentation, while maintaining efficient communication and targeted implementation.

## Rule #11

when I say do something in SSMR - that means adhering to the following tennets:

- 100% Safely
- Step-by-step
- Modular and Reversible


## Rule #12

Rule: "Save Chat" Protocol

When the user says "Save Chat" or similar, this means:

1. Save relevant context in current session and lastest status to a markdown file in "chat contexts" directory
2. Use YYYYMMDD prefix format for the filename: YYYYMMDD-[descriptive-name].md
3. Include comprehensive session summary with:
    - Current status and problems identified
    - All technical work completed
    - Files modified with key code changes
    - Next steps/pending tasks
    - Relevant file paths and test results
4. Use today's actual date from environment info, not dates mentioned in
conversation
5. Make it easy for another agent to resume - another session should be able to continue the work from this context

Example format: 20250820-litera-docx-converter-session.md
