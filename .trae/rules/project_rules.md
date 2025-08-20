# Agent Rules

## Rule #1
don't be lazy

## Rule #2
At the start of a chat session, read through DEVELOPMENT_GUIDELINES.md once, remember it, and follow it to the extent practicable in that session's work. no need to re-read once commited to context memory.  DO NOT modify this document without my approval.

## Rule #3
Any time i ask you to follow CSS Protocol, adhere to the following:

# Rule: Systematic CSS Debugging to Avoid Deadends

**Purpose:** Establish systematic approach to CSS debugging to reach solutions faster

## The CSS Debugging Protocol

When facing CSS styling issues, follow this exact sequence:

### 1. INSPECT FIRST, CODE SECOND
**Before writing any CSS:**
- Create browser debug script to inspect DOM structure
- Check computed styles on target elements
- Verify which elements are actually visible/rendered
- Identify all classes applied to target elements

### 2. IDENTIFY THE REAL PROBLEM
**Root cause analysis:**
- Count how many elements match your selector (expected vs actual)
- Check if mobile/desktop elements are both rendered simultaneously
- Verify media queries are working as expected
- Check CSS specificity conflicts

### 3. VERIFY SELECTOR TARGETING
**Before increasing specificity:**
- Ensure selectors target only intended elements
- Check for duplicate elements (mobile + desktop)
- Verify parent container structure matches expectations
- Test selectors in browser console first

### 4. SYSTEMATIC APPROACH CHECKLIST

#### For Layout/Responsive Issues:
- [ ] **DOM Inspection**: How many elements match the selector?
- [ ] **Visibility Check**: Which elements are actually visible?
- [ ] **Media Query Test**: Are breakpoints working correctly?
- [ ] **Class Verification**: Do elements have expected classes?
- [ ] **Specificity Check**: What CSS rules are actually being applied?

#### For Styling Issues:
- [ ] **Computed Styles**: What are the actual computed values?
- [ ] **CSS Cascade**: Which rules are overriding others?
- [ ] **Theme Conflicts**: Are theme-specific rules interfering?
- [ ] **Selector Precision**: Are we targeting exactly what we want?

### 5. DEBUGGING SCRIPT TEMPLATE
Always create a debug script like this:

```javascript
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

### 6. COMMON DEADEND PATTERNS TO AVOID

#### ❌ **Don't Do This:**
- Write CSS without knowing DOM structure
- Increase specificity without understanding why it's not working
- Assume mobile/desktop elements are mutually exclusive
- Skip checking if elements actually exist

#### ✅ **Do This Instead:**
- Inspect DOM first, then write targeted CSS
- Understand why current CSS doesn't work before fixing
- Verify element visibility and expected count
- Test selectors in browser console before implementing

### 7. ESCALATION TRIGGERS

If any of these occur, STOP and debug:
- CSS changes have no visual effect
- Unexpected number of matching elements
- Mobile styles applying on desktop (or vice versa)
- High specificity (!important) needed to override

### 8. SUCCESS METRICS

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
ignore any files with .ignore suffix, except don't ignore for purposes of syncing to git,  

## Rule #5
when creating new documentation files (e.g. to record plans, new features, new milestones etc), at the start of the file name, use convention:

YYYYMMDD_[Type]_Doc Name

So e.g.

a report after a refactor task on 5 July 2025 should be named like:
 
"20250705_Milestone_RefactorReport"


7 July 2025 = 20250707 - NOT 20250107

## Rule #6
when i ask you to investigate and plan (or shorthand "INP"), please:

- investigate thoroughly tracing through all relevant code flows,  variables and dependencies;
-  if helpful, check relevant git history;
- create a few fix solutions, prioritising the simplest and most elegant ones and avoid overthinking or overengineering unless that is the optimal path
- don't code yet.

## Rule #7
Single Sprint Documentation Protocol

When working on features during a sprint (identified by YYYYMMDD date prefix):

1. Single Source of Truth: Always maintain ONE central planning document per sprint (e.g., 20250709_Plan_ModularExperimentalLayout.md) that serves as the authoritative source for all feature status, progress, and implementation details.
2. No Piecemeal Documentation: Do NOT create separate individual documentation files for each bug fix, enhancement, or feature implementation during active development. Instead, update the central planning document with:
•  Status changes in the progress tracking section
•  Implementation details in the relevant feature sections
•  Completion notes with key accomplishments
3. Archive Management: If individual documentation files are created during development (for detailed investigation or complex implementations), immediately consolidate their content into the central document and move the individual files to a [YYYYMMDD]_sprint archive folder to maintain a clean documentation structure.
4. Update Central Document: Always update the central planning document's progress tracking, status summaries, and next priority sections when features are completed or status changes occur.
5. Documentation Location: Keep the central planning document in the appropriate subfolder (/docs/future-features/, /docs/experimental-features/, etc.) and archive folders directly under /docs/ for easy reference.

This approach ensures a single authoritative source of truth while preserving detailed implementation history in organized archives.

## Rule #8
when creating new .md documentation, except for regular github docs, save all docs under the /Docs folder heirarchy (or as i othewise specify)

## Rule #9
DO NOT start development server in chat.  when you want to run development server, do not "npm run dev" in the chat - instead ask me to run it externally, and tell me what you need to see / check and I will do so

## Rule #10
RULE: Collaborative Problem-Solving with user (Kai)

Working Style Observations:
•  Prefers thorough investigation over quick fixes ("pls INP" = investigate thoroughly, trace code flows, create solutions, don't code yet)
•  Values systematic troubleshooting that follows evidence rather than assumptions
•  Appreciates detailed technical explanations of root causes and solutions
•  Expects comprehensive documentation of milestones and fixes
•  Uses concise communication style but expects detailed technical depth in responses
•  Trusts the investigation process but wants implementation only after proper analysis

Optimal Collaboration Approach:
1. When given "INP" instruction: Conduct thorough investigation first, trace through all relevant code flows, check git history if helpful, propose multiple solutions prioritizing simplest/most elegant, and explicitly ask before implementing
2. Problem-solving methodology: Follow evidence systematically, use debugging tools and testing to verify hypotheses, explain technical root causes clearly, and document the complete problem→investigation→solution chain
3. Implementation style: Make targeted, minimal changes that preserve existing functionality, provide clear before/after explanations, include proper error handling and rollback options
4. Communication: Be concise in status updates but comprehensive in technical explanations, ask clarifying questions only when truly necessary for core functionality, and provide complete context for technical decisions
5. Documentation: Always document significant fixes with both technical details and user impact, update changelogs and create milestone documents, and include future testing recommendations

Key Success Factors:
•  Systematic investigation beats quick assumptions
•  Evidence-driven debugging with proper tooling
•  Minimal, targeted fixes that preserve existing functionality  
•  Comprehensive documentation for future reference
•  Clear technical explanations of root causes and solutions

This rule emphasizes Kai's preference for thorough, systematic problem-solving with comprehensive documentation, while maintaining efficient communication and targeted implementation.

## Rule #11
when I say do something in SSMR - that means adhering to the following tennets:

- 100% Safely
- Step-by-step
- Modular and Reversible 
