-- Convert global_books.level from text to text[]
ALTER TABLE public.global_books
ALTER COLUMN level TYPE text[]
USING CASE
  WHEN level IS NULL THEN NULL
  ELSE string_to_array(level, ',') -- Simple split by comma
END;

-- Trim whitespace from elements
UPDATE public.global_books
SET level = ARRAY(
  SELECT trim(elem)
  FROM unnest(level) AS elem
)
WHERE level IS NOT NULL;
