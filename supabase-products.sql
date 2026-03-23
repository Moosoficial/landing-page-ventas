-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  category_filter TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period TEXT NOT NULL,
  license_type TEXT NOT NULL,
  image_url TEXT,
  badge TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  specifications JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Insert products
-- ─────────────────────────────────────────────

-- 1. Adobe Photoshop
INSERT INTO products (
  product_key, name, title, category, category_filter, description,
  price, period, license_type, image_url, badge, sort_order,
  specifications, features
) VALUES (
  'photoshop',
  'Adobe Photoshop',
  'Adobe Photoshop',
  'Creative Suite — Suscripción',
  'creative',
  'El estándar de la industria para edición de imágenes y diseño gráfico profesional.',
  22.99,
  '/mes',
  'Suscripción mensual',
  'assets/images/photoshop.png',
  'Más vendido',
  1,
  '[
    {"icon": "cloud_done",    "text": "100GB Almacenamiento Cloud"},
    {"icon": "sync",          "text": "Sincronización Multi-dispositivo"},
    {"icon": "auto_awesome",  "text": "Adobe Firefly AI integrado"}
  ]'::jsonb,
  '[
    {"icon": "brush",         "iconClass": "primary",   "title": "Edición Profesional",  "desc": "Retoque, composición y creación de arte digital con precisión píxel por píxel."},
    {"icon": "auto_fix_high", "iconClass": "secondary", "title": "Relleno Generativo",   "desc": "Añade, elimina o expande contenido en imágenes usando prompts de texto."},
    {"icon": "layers",        "iconClass": "tertiary",  "title": "Capas y Máscaras",     "desc": "Flujo de trabajo no destructivo con infinitas posibilidades de composición."},
    {"icon": "color_lens",    "iconClass": "primary",   "title": "Gestión de Color",     "desc": "Soporte completo para espacios de color CMYK, RGB y perfiles personalizados."}
  ]'::jsonb
)
ON CONFLICT (product_key) DO UPDATE SET
  name           = EXCLUDED.name,
  title          = EXCLUDED.title,
  category       = EXCLUDED.category,
  category_filter= EXCLUDED.category_filter,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  period         = EXCLUDED.period,
  license_type   = EXCLUDED.license_type,
  image_url      = EXCLUDED.image_url,
  badge          = EXCLUDED.badge,
  sort_order     = EXCLUDED.sort_order,
  specifications = EXCLUDED.specifications,
  features       = EXCLUDED.features,
  updated_at     = NOW();

-- 2. Microsoft Office 365
INSERT INTO products (
  product_key, name, title, category, category_filter, description,
  price, period, license_type, image_url, badge, sort_order,
  specifications, features
) VALUES (
  'office',
  'Office 365',
  'Microsoft Office 365',
  'Productividad — Suscripción',
  'office',
  'Suite completa de productividad en la nube para trabajo individual y en equipo.',
  9.99,
  '/mes',
  'Suscripción mensual',
  'assets/images/office365.png',
  NULL,
  2,
  '[
    {"icon": "cloud_done", "text": "1TB OneDrive Storage"},
    {"icon": "people",     "text": "Hasta 6 usuarios"},
    {"icon": "security",   "text": "Seguridad Avanzada"}
  ]'::jsonb,
  '[
    {"icon": "description", "iconClass": "primary",   "title": "Creación de Documentos", "desc": "Redacta documentos profesionales con asistencia inteligente de escritura."},
    {"icon": "table_chart", "iconClass": "secondary", "title": "Análisis de Datos",      "desc": "Descubre patrones y tendencias complejas con las fórmulas avanzadas de Excel."},
    {"icon": "co_present",  "iconClass": "tertiary",  "title": "Presentaciones Dinámicas","desc": "Diseña diapositivas impactantes con sugerencias de diseño automatizadas."},
    {"icon": "forum",       "iconClass": "primary",   "title": "Comunicación Fluida",    "desc": "Reuniones y chat integrados en una sola plataforma con Microsoft Teams."}
  ]'::jsonb
)
ON CONFLICT (product_key) DO UPDATE SET
  name           = EXCLUDED.name,
  title          = EXCLUDED.title,
  category       = EXCLUDED.category,
  category_filter= EXCLUDED.category_filter,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  period         = EXCLUDED.period,
  license_type   = EXCLUDED.license_type,
  image_url      = EXCLUDED.image_url,
  badge          = EXCLUDED.badge,
  sort_order     = EXCLUDED.sort_order,
  specifications = EXCLUDED.specifications,
  features       = EXCLUDED.features,
  updated_at     = NOW();

-- 3. AutoCAD 2024
INSERT INTO products (
  product_key, name, title, category, category_filter, description,
  price, period, license_type, image_url, badge, sort_order,
  specifications, features
) VALUES (
  'autocad',
  'AutoCAD 2024',
  'AutoCAD 2024',
  'Engineering — Licencia Anual',
  'engineering',
  'Software de diseño CAD líder en la industria para ingeniería, arquitectura y construcción.',
  235.00,
  '/año',
  'Licencia anual',
  'assets/images/autocad.png',
  'Nuevo',
  3,
  '[
    {"icon": "architecture",  "text": "Toolset Específico"},
    {"icon": "3d_rotation",   "text": "Modelado 3D Avanzado"},
    {"icon": "devices",       "text": "Web & Mobile Apps"}
  ]'::jsonb,
  '[
    {"icon": "draw",       "iconClass": "primary",   "title": "Dibujo de Precisión", "desc": "Crea geometrías 2D y modelos 3D con la máxima exactitud del mercado."},
    {"icon": "autorenew",  "iconClass": "secondary", "title": "Automatización",      "desc": "Reemplaza bloques, cuenta objetos y compara dibujos automáticamente."},
    {"icon": "cloud",      "iconClass": "tertiary",  "title": "Colaboración Cloud",  "desc": "Revisa y edita archivos DWG en tiempo real con tu equipo desde cualquier lugar."},
    {"icon": "extension",  "iconClass": "primary",   "title": "Personalización API", "desc": "Agrega add-ons y rutinas LISP específicas para adaptar el software a tu industria."}
  ]'::jsonb
)
ON CONFLICT (product_key) DO UPDATE SET
  name           = EXCLUDED.name,
  title          = EXCLUDED.title,
  category       = EXCLUDED.category,
  category_filter= EXCLUDED.category_filter,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  period         = EXCLUDED.period,
  license_type   = EXCLUDED.license_type,
  image_url      = EXCLUDED.image_url,
  badge          = EXCLUDED.badge,
  sort_order     = EXCLUDED.sort_order,
  specifications = EXCLUDED.specifications,
  features       = EXCLUDED.features,
  updated_at     = NOW();

-- 4. Ableton Live 12
INSERT INTO products (
  product_key, name, title, category, category_filter, description,
  price, period, license_type, image_url, badge, sort_order,
  specifications, features
) VALUES (
  'ableton',
  'Ableton Live 12',
  'Ableton Live 12',
  'Audio Production — Licencia Vitalicia',
  'audio',
  'DAW profesional para producción musical, performance en vivo y creación de sonido.',
  449.00,
  'único',
  'Licencia vitalicia',
  'assets/images/ableton.png',
  NULL,
  4,
  '[
    {"icon": "piano",       "text": "Instrumentos Virtuales"},
    {"icon": "mic",         "text": "Grabación Multipista"},
    {"icon": "graphic_eq",  "text": "Efectos Nativos"}
  ]'::jsonb,
  '[
    {"icon": "queue_music", "iconClass": "primary",   "title": "Session View",       "desc": "Improvisa y explora ideas musicales sin la restricción de una línea de tiempo."},
    {"icon": "tune",        "iconClass": "secondary", "title": "Warping Audio",       "desc": "Ajusta el tempo y timing de cualquier audio en tiempo real sin perder calidad."},
    {"icon": "sensors",     "iconClass": "tertiary",  "title": "Soporte MIDI MPE",    "desc": "Crea bends, slides y presiones expresivas para acordes individuales."},
    {"icon": "album",       "iconClass": "primary",   "title": "Librería de Sonidos", "desc": "Más de 70GB de samples premium, kits y bucles listos para ser usados."}
  ]'::jsonb
)
ON CONFLICT (product_key) DO UPDATE SET
  name           = EXCLUDED.name,
  title          = EXCLUDED.title,
  category       = EXCLUDED.category,
  category_filter= EXCLUDED.category_filter,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  period         = EXCLUDED.period,
  license_type   = EXCLUDED.license_type,
  image_url      = EXCLUDED.image_url,
  badge          = EXCLUDED.badge,
  sort_order     = EXCLUDED.sort_order,
  specifications = EXCLUDED.specifications,
  features       = EXCLUDED.features,
  updated_at     = NOW();

-- 5. Adobe Illustrator
INSERT INTO products (
  product_key, name, title, category, category_filter, description,
  price, period, license_type, image_url, badge, sort_order,
  specifications, features
) VALUES (
  'illustrator',
  'Adobe Illustrator',
  'Adobe Illustrator',
  'Creative Suite — Suscripción',
  'creative',
  'El software vectorial de referencia para crear logotipos, iconos e ilustraciones escalables.',
  22.99,
  '/mes',
  'Suscripción mensual',
  'assets/images/illustrator.png',
  NULL,
  5,
  '[
    {"icon": "cloud_done",   "text": "100GB Almacenamiento Cloud"},
    {"icon": "text_format",  "text": "Acceso a Adobe Fonts"},
    {"icon": "auto_awesome", "text": "Generación Vectorial AI"}
  ]'::jsonb,
  '[
    {"icon": "format_shapes", "iconClass": "primary",   "title": "Trazos Precisos",    "desc": "Crea logotipos e iconos escalables con un control bezier absoluto."},
    {"icon": "color_lens",    "iconClass": "secondary", "title": "Recoloreado AI",      "desc": "Prueba múltiples paletas de colores en tu arte instantáneamente con IA."},
    {"icon": "text_fields",   "iconClass": "tertiary",  "title": "Tipografía Avanzada", "desc": "Control al nivel de glifo para crear y modificar fuentes de texto."},
    {"icon": "share",         "iconClass": "primary",   "title": "Exportación Múltiple","desc": "Genera assets para web, móvil e impresión con un solo clic."}
  ]'::jsonb
)
ON CONFLICT (product_key) DO UPDATE SET
  name           = EXCLUDED.name,
  title          = EXCLUDED.title,
  category       = EXCLUDED.category,
  category_filter= EXCLUDED.category_filter,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  period         = EXCLUDED.period,
  license_type   = EXCLUDED.license_type,
  image_url      = EXCLUDED.image_url,
  badge          = EXCLUDED.badge,
  sort_order     = EXCLUDED.sort_order,
  specifications = EXCLUDED.specifications,
  features       = EXCLUDED.features,
  updated_at     = NOW();
