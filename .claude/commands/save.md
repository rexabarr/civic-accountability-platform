Save all current changes to GitHub with a smart commit message.

Steps:
1. Run `git status` to see what changed
2. Run `git diff --stat` to understand what was modified
3. Write a short, clear commit message that describes what changed (e.g. "add staff portal page", "fix login bug", "update complaint form")
4. Run `git add -A`
5. Run `git commit -m "<your message>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`
6. Run `git push`
7. Tell the user it's saved and link them to: https://github.com/rexabarr/civic-accountability-platform
