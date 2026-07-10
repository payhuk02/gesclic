-- Script pour attribuer le rôle super_admin à agenceedigit@gmail.com
-- Exécuter ce script dans le SQL Editor de Supabase

-- Étape 0: Ajouter 'super_admin' à l'enum app_role
ALTER TYPE app_role ADD VALUE 'super_admin';

-- Étape 1: Trouver l'ID de l'utilisateur
SELECT id, email 
FROM auth.users 
WHERE email = 'agenceedigit@gmail.com';

-- Étape 2: Attribuer le rôle super_admin
-- Remplacez USER_ID par l'ID trouvé à l'étape précédente
-- Exemple: INSERT INTO user_roles (user_id, role) VALUES ('123e4567-e89b-12d3-a456-426614174000', 'super_admin');

INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'agenceedigit@gmail.com'),
  'super_admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Étape 3: Vérifier l'attribution
SELECT 
  ur.user_id,
  ur.role,
  u.email,
  u.created_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'super_admin';

-- Étape 4: Vérifier que l'utilisateur a le bon rôle
SELECT 
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'agenceedigit@gmail.com';
