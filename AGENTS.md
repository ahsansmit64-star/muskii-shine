<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Authenticate customers through Clerk; exchange verified, active Clerk sessions server-side for one-use Cloud sessions so existing UUID-owned records and RLS remain authoritative.
- Keep Clerk-to-Cloud identity mappings service-only; admin database permissions require a verified mapping and a separately stored role, never client metadata.
- Configure credential requirements and failed-sign-in lockout in Clerk; website countdowns are display only, not the enforcement boundary.
