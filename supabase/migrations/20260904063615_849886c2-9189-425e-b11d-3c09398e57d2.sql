-- Semi-admin (moderator) can manage content tables
CREATE POLICY "courses_moderator_all" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "subjects_moderator_all" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "chapters_moderator_all" ON public.chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "lessons_moderator_all" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "lesson_parts_moderator_all" ON public.lesson_parts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "quizzes_moderator_all" ON public.quizzes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "questions_moderator_all" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'moderator'));

-- Admins can read every user's attempts (user details view)
CREATE POLICY "attempts_select_admin" ON public.attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));