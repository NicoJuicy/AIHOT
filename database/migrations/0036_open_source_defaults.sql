-- A new source shows a summary and the link to the original unless it is marked as allowing full text.
ALTER TABLE sources ALTER COLUMN site_fulltext SET DEFAULT false;

-- Circuit breakers for the deployment's own model (LLM_*) and embedding (EMBEDDING_*) services.
INSERT INTO budgets (service, per_minute, per_hour, per_day, note) VALUES
  ('llm', 300, 6000, 40000, 'Model call breaker (default model, shared by all steps)'),
  ('embedding', 300, 6000, 40000, 'Embedding call breaker')
ON CONFLICT (service) DO NOTHING;
