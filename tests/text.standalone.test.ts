import assert from "node:assert/strict";
import { test } from "node:test";
import { looksEnglish } from "@aihot/backend/editorial/writing";
import { isEnglishBody, exportTranslation } from "@aihot/backend/publication/items";
import { stripTags } from "@aihot/backend/lib/text";

// Regression coverage for HTML attributes that contain `>` in real source pages.
test("stripTags ignores > inside quoted HTML attributes", () => {
  assert.equal(
    stripTags('<a title="Platforms > Xbox [11,780 articles]" href="/xbox">Xbox</a>'),
    "Xbox",
  );
  assert.equal(stripTags("<a title='Platforms > Xbox' href='/xbox'>A > B</a>"), "A > B");
  assert.equal(stripTags(`<a title = "don't > do" href = '/xbox'>Xbox</a>`), "Xbox");
  assert.equal(stripTags(`<a\ttitle\n=\f"Platforms > Xbox" href='/xbox'>Xbox</a>`), "Xbox");
});

test("stripTags does not pair quotes inside unquoted attribute values", () => {
  assert.equal(stripTags("<a title=don't>Xbox</a><p>next paragraph</p>"), "Xbox next paragraph");
  assert.equal(stripTags("<a title=don't>Xbox</a><p title=it's>next paragraph</p>"), "Xbox next paragraph");
  assert.equal(stripTags(`<a data-note=a='b title="Platforms > Xbox">Xbox</a>`), "Xbox");
});

test("stripTags keeps existing comment handling without swallowing following text", () => {
  for (const comment of ["<!-- note -->", "<!-->", "<!--->", "<!-- note --!>", "<!-- don't -->"]) {
    assert.equal(stripTags(`${comment}<p>visible article</p>`), "visible article");
  }
});

test("stripTags preserves existing spacing, entities, and hidden-content handling", () => {
  assert.equal(stripTags("<p>one</p><p>two</p>"), "one two");
  assert.equal(stripTags("a<br>b"), "a b");
  assert.equal(stripTags("<script>hidden</script><style>hidden</style><noscript>hidden</noscript>visible"), "visible");
  assert.equal(stripTags("&nbsp;&amp; &lt;code&gt; &quot;text&quot; &#39;one&apos;"), '& <code> "text" \'one\'');
});

test("stripTags keeps existing handling of incomplete tags and unclosed attribute quotes", () => {
  assert.equal(stripTags('text <a title="unfinished'), 'text <a title="unfinished');
  assert.equal(stripTags('text <a title="unfinished>visible'), "text");
  assert.equal(stripTags('<a ="unfinished>y">tail'), 'y">tail');
});

// Feeds escape text twice, so a title arrives as "AI&#8217;s leaders" and code as "mtime:&amp;lt;7d":
// character references are text too, and the text meant is what a reader expects.
test("stripTags decodes character references, also when a feed escaped them twice", () => {
  assert.equal(stripTags("AI&#8217;s leaders, AT&#038;T &#x2014; done&#8230;"), "AI’s leaders, AT&T — done…");
  assert.equal(stripTags("AI&amp;#8217;s &amp;lt;7d&gt;"), "AI’s <7d>");
  assert.equal(stripTags("Gemini &mdash; &ldquo;fast&rdquo; &amp;hellip; caf&eacute; 5&times;"), "Gemini — “fast” … café 5×");
  // Only references that end in a semicolon: an address keeps "&copy=" and an unknown name stays as written.
  assert.equal(stripTags("?a=1&copy=2 &unknown; AT&T"), "?a=1&copy=2 &unknown; AT&T");
});

test("writing and public reading agree about English, including other languages in Latin letters", () => {
  for (const body_text of ["Новая модель искусственного интеллекта выпущена.", "Le nouveau modèle de Mistral est disponible pour les développeurs.", "Die neue Version ist ab heute für alle verfügbar."]) {
    assert.equal(looksEnglish(body_text), false);
    for (const language of [null, "ru", "fr"]) {
      assert.equal(isEnglishBody({ language, body_text }), false);
      assert.equal(exportTranslation({ language, body_text, tr_html: "<p>A new model was released.</p>", tr_complete: true }), "<p>A new model was released.</p>");
    }
  }
  assert.equal(isEnglishBody({ language: "fr", body_text: "The model is available today." }), false);
  assert.equal(isEnglishBody({ language: null, body_text: "The new model is available to every developer from today." }), true);
  assert.equal(isEnglishBody({ language: "en-US", body_text: "API" }), true);
  assert.equal(isEnglishBody({ language: "en", body_text: "An English article quoting искусственный интеллект." }), true);
});
