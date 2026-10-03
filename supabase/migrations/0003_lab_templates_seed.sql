create table public.lab_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('miller-urey', 'endosymbiosis', 'invasive-species', 'biomagnification')),
  title text not null,
  category text not null check (category in ('origin-of-life', 'ecology')),
  summary text not null,
  estimated_minutes int not null default 45,
  default_journal_schema jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.lab_templates is 'The 4 fixed lab simulations. Slug is the join key to the React component tree under app/labs/_components/<slug>/. Seed data only — never written to by the app.';

insert into public.lab_templates (slug, title, category, summary, estimated_minutes, default_journal_schema) values
(
  'miller-urey',
  'Origin of Life — The Miller-Urey Experiment',
  'origin-of-life',
  'Recreate the classic 1952 apparatus: mix early-Earth atmospheric gases, strike simulated lightning, and test whether the building blocks of life can form from non-living chemistry.',
  40,
  '{
    "version": 1,
    "prompts": [
      { "id": "hypothesis", "type": "long_text", "label": "Before running any trials, predict: if Earth''s early atmosphere was mostly methane, ammonia, hydrogen, and water vapor, and lightning struck repeatedly, what kinds of molecules do you think could form in the ocean below? Explain your reasoning.", "required": true },
      { "id": "trial_observations", "type": "long_text", "label": "Run at least 3 trials with different gas mixtures. Describe what you observed in the apparatus during each trial and which organic compounds were detected in the collection trap.", "required": true },
      { "id": "gas_mixture_effect", "type": "long_text", "label": "Compare a trial that included both methane and ammonia to a trial that excluded one of them. How did removing a gas change the results, and what does that suggest about the role of atmospheric composition?", "required": true },
      { "id": "limitations", "type": "long_text", "label": "Miller and Urey''s experiment produced amino acids, but amino acids are not alive. Explain the gap between \"created organic molecules\" and \"created life,\" and name one thing this experiment does NOT prove about the origin of life.", "required": true },
      { "id": "real_world_connection", "type": "short_text", "label": "Scientists now think Earth''s early atmosphere may have had less methane/ammonia and more CO2/N2 than Miller and Urey assumed. Why does that matter for how we interpret this experiment''s results?", "required": false }
    ]
  }'::jsonb
),
(
  'endosymbiosis',
  'Origin of Life — Endosymbiotic Theory',
  'origin-of-life',
  'Sort real cellular evidence to test the endosymbiotic theory, then build the evolutionary timeline from free-living prokaryote to modern organelle.',
  40,
  '{
    "version": 1,
    "prompts": [
      { "id": "sorting_rationale", "type": "long_text", "label": "For each piece of evidence you sorted into \"Supports Endosymbiotic Theory,\" explain why that trait makes more sense for a former free-living prokaryote than for a structure that originated inside the host cell.", "required": true },
      { "id": "counter_evidence", "type": "long_text", "label": "Was there any evidence you were tempted to sort the opposite way? What made that one tricky?", "required": false },
      { "id": "timeline_prediction", "type": "long_text", "label": "Summarize the predictions you made at the \"engulfment\" and \"stable symbiosis\" stages of your timeline. What did the host cell and the engulfed prokaryote each need from the relationship in order to survive?", "required": true },
      { "id": "mitochondria_vs_chloroplast", "type": "long_text", "label": "Mitochondria and chloroplasts are both believed to have originated through separate endosymbiotic events. Based on what each one does for the cell today, what kind of free-living ancestor would you expect each one descended from?", "required": true },
      { "id": "conclusion", "type": "long_text", "label": "If a classmate said \"mitochondria are just a part of the cell, they didn''t used to be a separate organism,\" what evidence from this lab would you use to respond?", "required": true }
    ]
  }'::jsonb
),
(
  'invasive-species',
  'Ecology — Invasive Species',
  'ecology',
  'Introduce an invasive species into a simulated ecosystem, watch population dynamics unfold year by year, and test management strategies against real biodiversity math.',
  45,
  '{
    "version": 1,
    "prompts": [
      { "id": "prediction", "type": "long_text", "label": "Before running your simulation, predict what will happen to the native population once your chosen invasive species is introduced with no management strategy applied. Explain your reasoning.", "required": true },
      { "id": "data_table", "type": "table", "label": "Record your simulation results at regular intervals.", "columns": ["year", "native_population", "invasive_population", "note"], "required": true },
      { "id": "graph_interpretation", "type": "long_text", "label": "Describe the shape of your population graph. Did the invasive and native population lines cross? What does the slope of each line tell you about growth rate?", "required": true },
      { "id": "management_strategy", "type": "long_text", "label": "Apply at least one management strategy mid-simulation. Which one did you choose, when did you apply it, and what happened to both population curves afterward?", "required": true },
      { "id": "biodiversity_reflection", "type": "long_text", "label": "Using your final biodiversity-impact figure, explain why invasive species are considered a leading cause of biodiversity loss, citing your own simulation''s numbers as evidence.", "required": true }
    ]
  }'::jsonb
),
(
  'biomagnification',
  'Ecology — Biomagnification',
  'ecology',
  'Build a food chain, introduce a persistent pollutant at the producer level, and calculate how its concentration compounds at every trophic level above it.',
  35,
  '{
    "version": 1,
    "prompts": [
      { "id": "chain_setup", "type": "short_text", "label": "List the food chain you built, in order from producer to top consumer.", "required": true },
      { "id": "concentration_table", "type": "table", "label": "Record the calculated pollutant concentration at each trophic level.", "columns": ["trophic_level", "organism", "concentration_ppm"], "required": true },
      { "id": "math_explanation", "type": "long_text", "label": "Using your own numbers, explain why the pollutant concentration increased at each step up the food chain even though no new pollutant was added after the producer level.", "required": true },
      { "id": "real_world_case", "type": "long_text", "label": "Recall a real example of biomagnification (e.g. DDT in bald eagles, mercury in tuna). How does your simulation''s math compare to what happened in that real case?", "required": true },
      { "id": "apex_predator_risk", "type": "long_text", "label": "Why are apex predators, including humans who eat a lot of fish, at the greatest risk from biomagnification, even though they are never directly exposed to the original pollutant source?", "required": true }
    ]
  }'::jsonb
);
