-- Fix malformed level arrays where comma-separated values were not split
-- E.g. changes ['3. Klasse, 4. Klasse'] to ['3. Klasse', '4. Klasse']

UPDATE public.global_books
SET level = ARRAY(
  SELECT trim(elem)
  FROM unnest(level) AS l_str,
       unnest(string_to_array(l_str, ',')) AS elem
)
WHERE level IS NOT NULL;
