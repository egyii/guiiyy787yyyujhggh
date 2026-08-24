
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  difficulty text NOT NULL DEFAULT 'NOVICE',
  icon text NOT NULL DEFAULT '{ }',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO anon;
GRANT SELECT ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_public_read" ON public.quizzes FOR SELECT USING (true);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.questions TO anon;
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_public_read" ON public.questions FOR SELECT USING (true);

CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total integer NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select_own" ON public.attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON public.attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.award_attempt_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET xp = xp + NEW.xp_earned
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_attempt_created
AFTER INSERT ON public.attempts
FOR EACH ROW EXECUTE FUNCTION public.award_attempt_xp();

INSERT INTO public.quizzes (slug, title, description, category, difficulty, icon) VALUES
('react-ecosystem','React & Ecosystem','Hooks, Server Components, and State Management patterns.','Frontend','EXPERT','{ }'),
('linux-mastery','Linux Mastery','Essential bash commands and filesystem fundamentals.','Systems','NOVICE','$_'),
('space-oddities','Space Oddities','Planets, probes and the strange physics of the void.','Science','ADEPT','*'),
('web-history','Web History','From ARPANET to the modern browser wars.','Culture','NOVICE','#'),
('algorithms','Algorithm Arena','Complexity, sorting and the classics of computer science.','CS','EXPERT','>_'),
('world-trivia','World Trivia','Capitals, flags and geography curveballs.','General','ADEPT','@');

INSERT INTO public.questions (quiz_id, prompt, options, correct_index, position)
SELECT q.id, v.prompt, v.options::jsonb, v.correct_index, v.position
FROM public.quizzes q
JOIN (VALUES
('react-ecosystem','Which hook synchronises a component with an external system?','["useMemo","useEffect","useRef","useId"]',1,0),
('react-ecosystem','What does a React Server Component NOT support?','["async data fetching","useState","imports","rendering children"]',1,1),
('react-ecosystem','Which tool is a state manager?','["Vite","Zustand","ESLint","Prettier"]',1,2),
('react-ecosystem','What is the key prop used for?','["styling","list reconciliation","routing","memoisation"]',1,3),
('react-ecosystem','Which API defers a non-urgent update?','["useTransition","useLayoutEffect","useDebugValue","useContext"]',0,4),
('linux-mastery','Which command lists files including hidden ones?','["ls -a","cd -a","cat -a","mv -a"]',0,0),
('linux-mastery','What does chmod 755 grant the owner?','["read only","read+write+execute","nothing","execute only"]',1,1),
('linux-mastery','Which file describes mounted filesystems at boot?','["/etc/hosts","/etc/fstab","/etc/passwd","/proc/cpu"]',1,2),
('linux-mastery','Which signal does kill send by default?','["SIGKILL","SIGTERM","SIGHUP","SIGINT"]',1,3),
('linux-mastery','What does grep -r do?','["reverse match","recursive search","replace text","rename files"]',1,4),
('space-oddities','Which planet rotates on its side?','["Mars","Uranus","Venus","Neptune"]',1,0),
('space-oddities','What is the closest star to the Sun?','["Sirius","Proxima Centauri","Betelgeuse","Vega"]',1,1),
('space-oddities','Which probe left the solar system first?','["Voyager 1","Cassini","New Horizons","Juno"]',0,2),
('space-oddities','A light-year measures what?','["time","distance","brightness","mass"]',1,3),
('space-oddities','Which moon has thick nitrogen air?','["Europa","Titan","Io","Phobos"]',1,4),
('web-history','Who proposed the World Wide Web?','["Alan Turing","Tim Berners-Lee","Linus Torvalds","Vint Cerf"]',1,0),
('web-history','Which browser sparked the first browser war?','["Netscape Navigator","Chrome","Safari","Opera"]',0,1),
('web-history','What year did CSS1 arrive?','["1996","2001","1990","2005"]',0,2),
('web-history','What does HTTP stand for?','["HyperText Transfer Protocol","High Transfer Text Path","Hyperlink Type Protocol","Host Text Transfer Port"]',0,3),
('web-history','Which company created JavaScript?','["Microsoft","Netscape","Sun","IBM"]',1,4),
('algorithms','Average complexity of quicksort?','["O(n log n)","O(n^2)","O(n)","O(log n)"]',0,0),
('algorithms','Which structure is FIFO?','["stack","queue","heap","trie"]',1,1),
('algorithms','Binary search requires the input to be...','["sorted","hashed","unique","reversed"]',0,2),
('algorithms','Which algorithm finds shortest paths with weights?','["Dijkstra","DFS","Kruskal","Bellman sort"]',0,3),
('algorithms','Hash table average lookup is...','["O(1)","O(n)","O(n log n)","O(n^2)"]',0,4),
('world-trivia','What is the capital of Australia?','["Sydney","Canberra","Melbourne","Perth"]',1,0),
('world-trivia','Which river is the longest?','["Amazon","Nile","Yangtze","Danube"]',1,1),
('world-trivia','How many time zones does Russia span?','["7","11","5","15"]',1,2),
('world-trivia','Which country has the most islands?','["Sweden","Indonesia","Canada","Norway"]',0,3),
('world-trivia','Mount Kilimanjaro is in which country?','["Kenya","Tanzania","Uganda","Ethiopia"]',1,4)
) AS v(slug, prompt, options, correct_index, position) ON v.slug = q.slug;
