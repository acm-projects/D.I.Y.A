<p align="center">
  <img src="200.gif" alt="D.I.Y.A demo" width="600" height="400">
</p>

<h1 align="center">D.I.Y.A</h1>
<h3 align="center">Digital Intake, Yielding Answers</h3>

<p align="center">
  Prepared by: <b>Shreya S Ramani</b>
</p>

## 🔍 Summary
D.I.Y.A. is a web app for structured office hours that improves the student help experience and generates course analytics for professors and TAs. It combines a standardized intake workflow with a live help flow, plus a course forum that reduces duplicate questions using search and upvotes, and adds AI-assisted answers that staff can verify or correct. :contentReference[oaicite:0]{index=0}

## 🧭 Workflow (from the PDF)
### Roles
- **Student**
- **Professor / TA (Admin)** :contentReference[oaicite:1]{index=1}

### Group-based onboarding
1. **Prof/TA creates a group** for the class.
2. **Invite is sent to students via email.**
3. Student clicks invite:
   - If no account: **sign up first**, then join the group (using student email).
   - If account exists: **log in** and join the group. :contentReference[oaicite:2]{index=2}

### Student view (inside a group)
- Student dashboard shows all groups.
- If they arrived via invite link, a popup asks to join:
  - Accept: group is added to dashboard
  - Reject: popup closes and nothing changes :contentReference[oaicite:3]{index=3}
- Inside a group, the **Forum Page** is the opening page (reddit-style).
  - Post questions (text and optionally an image)
  - Duplicate detection while typing:
    - Suggest similar existing posts
    - Ask student to **upvote existing** or **post anyway**
  - Keyword search existing posts
  - After posting, **AI attaches a potential answer** to the post :contentReference[oaicite:4]{index=4}
- **Self-Grade Page (side nav option)**
  - Upload assignment rubric + current work
  - AI returns an estimated grade report:
    - potential grade received
    - what to improve and why
  - History stores past self-checks :contentReference[oaicite:5]{index=5}
- **Office Hour Request Page (side nav option)**
  - Request a meetup outside normal times
  - Fields include: requesting Prof/TA, what the request is for, proposed dates/times, etc.
  - Student receives email confirmation after successful submission :contentReference[oaicite:6]{index=6}

### Prof/TA (Admin) view (inside a group)
- Admin dashboard shows all groups and includes an **Add Group** option to create new groups :contentReference[oaicite:7]{index=7}
- **Forum Page (opening page)**
  - Admin can see AI answers on posts
  - Admin actions:
    - add a verified tag if they agree with the AI answer
    - add additional comments to the thread
    - strike out the AI answer if wrong and provide the correct answer :contentReference[oaicite:8]{index=8}
- **Analytics Page (side nav option)**
  - AI keyword analysis over posts:
    - most common types of questions
    - topics that need to be revisited or explained :contentReference[oaicite:9]{index=9}
- **Office-Hour Requests Page (side nav option)**
  - Accept a request and set up online or in-person meeting (invite sent to student via UTD email)
  - Deny a request and propose alternative dates/times :contentReference[oaicite:10]{index=10}

## 🛠️ MVP Features (10-week, beginner friendly)
- Group creation + invite-based joining (student + admin)
- Student dashboard (groups) + join popup flow
- Course forum:
  - create post (text + optional image)
  - search before posting + duplicate suggestions
  - upvotes
  - AI suggested answer on post creation
- Self-grade page (rubric upload + AI feedback + history)
- Office-hour request submission + email confirmation
- Admin moderation of AI answers (verify, comment, correct)
- Admin analytics page (AI keyword trends)
- Admin request management (accept/deny with alternatives)

## 🚀 Stretch Goals
- Stronger duplicate merging (combine threads + unify upvotes)
- Realtime live help queue with wait-time estimates and state transitions
- Notifications (“you’re next”) via email/push
- Searchable knowledge base generated from verified resolutions
- Multi-staff assignment + throughput metrics
- LMS linking + calendar-driven sessions

# 📅 Timeline (10-Week Plan)
| 🏁 Week | 📌 Task |
|--------|--------|
| **1**  | Define scope, roles, data model, and wireframes for student flow and staff triage |
| **2**  | Set up Next.js app and Supabase project, tables for groups, invites, posts, requests, basic UI skeleton |
| **3**  | Build auth (optional), dashboards, and group join flow |
| **4**  | Build forum posting + search + duplicate suggestion UI |
| **5**  | Add upvotes + AI answer attachment pipeline |
| **6**  | Build self-grade page + history |
| **7**  | Build office-hour request submission + confirmations |
| **8**  | Build admin forum tools (verify/correct AI answers) |
| **9**  | Build analytics page (keyword trends) + requests management (accept/deny) |
| **10** | Testing, edge cases, polish, documentation, deploy on Vercel |

## 💻 Tech Stack
- **Frontend + API routes:** Next.js (App Router)
- **Database + Realtime:** Supabase Postgres + realtime subscriptions
- **Auth:** Supabase Auth (optional in MVP, add later)
- **UI:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel + Supabase

## 📚 Resources (Beginner-Friendly)

<details>
  <summary><strong> Next.js (App Router) </strong></summary>
  <ul>
    <li><a href="https://nextjs.org/docs/app">Next.js App Router docs</a></li>
    <li><a href="https://nextjs.org/learn">Next.js Learn</a></li>
  </ul>
</details>

<details>
  <summary><strong> Supabase (Postgres + Realtime) </strong></summary>
  <ul>
    <li><a href="https://supabase.com/docs">Supabase docs</a></li>
    <li><a href="https://supabase.com/docs/guides/realtime">Realtime subscriptions</a></li>
  </ul>
</details>

<details>
  <summary><strong> Supabase Auth + RLS </strong></summary>
  <ul>
    <li><a href="https://supabase.com/docs/guides/auth">Supabase Auth</a></li>
    <li><a href="https://supabase.com/docs/guides/database/postgres/row-level-security">Row Level Security</a></li>
  </ul>
</details>

<details>
  <summary><strong> Tailwind CSS + shadcn/ui </strong></summary>
  <ul>
    <li><a href="https://tailwindcss.com/docs">Tailwind docs</a></li>
    <li><a href="https://ui.shadcn.com/docs">shadcn/ui docs</a></li>
  </ul>
</details>

<details>
  <summary><strong> Deployment (Vercel) </strong></summary>
  <ul>
    <li><a href="https://vercel.com/docs">Vercel docs</a></li>
    <li><a href="https://vercel.com/docs/frameworks/nextjs">Deploy Next.js on Vercel</a></li>
  </ul>
</details>

## ⚔️ Competition
- Forms/spreadsheets: fast but not built for duplicate reduction, moderation, or analytics
- Async forums: great for discussion but not optimized for structured intake and triage
- Appointment schedulers: good for 1:1 but weak for high-volume bursts
- Chat-based queues: quick but hard to standardize and analyze  
D.I.Y.A. differentiates by combining structured intake, duplicate consolidation (search + upvotes), AI-assisted answers with staff verification, and course analytics. :contentReference[oaicite:11]{index=11}

## 🚧 Roadblocks and Potential Solutions
1) **Realtime correctness and race conditions**  
   - Add optimistic locking, last-updated checks, or a simple “locked by” field for staff actions.
2) **Security and privacy**  
   - Keep minimal student data in MVP, then add Supabase Auth + RLS role policies per course/group.
3) **Adoption friction**  
   - Default presets, very short intake, one-click moderation actions, and fast search-first UX.

## 📄 Ideation PDF

- **Workflow Ideation PDF:** [Open the PDF](D.I.Y.A Workflow Ideation.pdf)

### Option B (link to the uploaded file here)
- **Workflow Ideation PDF:** [Open the PDF](sandbox:/mnt/data/D.I.Y.A%20Workflow%20Ideation.pdf) :contentReference[oaicite:12]{index=12}
