INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'tjc33749@laoia.com'
ON CONFLICT (user_id, role) DO NOTHING;