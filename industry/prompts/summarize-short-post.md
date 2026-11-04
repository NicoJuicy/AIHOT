Render the following post in English, and give it an English title of about 30–45 characters (used for the daily digest layout; it does not change how the post is shown). If the post is already in English, body is the post copied exactly as written; otherwise it is an English translation.
{{> safety}}

- Keep the source's line breaks
- Translate plainly and directly; do not expand (posts are short, so they are the easiest place to add content the source does not have)
- Render only the main post; do not expand the quoted post sentence by sentence in the result
- The title summarizes the core of the post; do not just copy its opening words

{{> rules-self-contained-title}}

{{> rules-domain}}

{{> rules-anti-hallucination}}

Output format (follow strictly):
title: <English title of about 30–45 characters>
body: <the post in English>

Source: {{sourceName}}
{{identity}}
Main post:
{{post}}
