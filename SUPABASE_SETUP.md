# Guía de Configuración de Supabase para NutriGo

## Paso 1: Crear cuenta y proyecto en Supabase

1. Ve a **[https://supabase.com](https://supabase.com)** y haz clic en **"Start your project"**
2. Inicia sesión con tu cuenta de **GitHub** (o crea una cuenta nueva)
3. En el dashboard, haz clic en **"New Project"**
4. Llena los datos:
   - **Organization**: Selecciona tu organización o crea una
   - **Name**: `nutrigo` (o el nombre que prefieras)
   - **Database Password**: Escoge una contraseña segura (¡guárdala!)
   - **Region**: Selecciona la más cercana a tus usuarios (ej: `South America (São Paulo)`)
5. Haz clic en **"Create new project"** — espera ~2 minutos a que se configure

---

## Paso 2: Obtener credenciales

1. En tu proyecto de Supabase, ve a **Settings** (ícono de engranaje en la barra lateral izquierda)
2. Haz clic en **"API"** en el menú lateral
3. Copia estos dos valores:
   - **Project URL**: algo como `https://abc123xyz.supabase.co`
   - **anon public key**: un string largo que empieza con `eyJ...`

---

## Paso 3: Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve a **SQL Editor** (ícono de código en la barra lateral)
2. Haz clic en **"New query"**
3. Abre el archivo `supabase/schema.sql` de tu proyecto local
4. Copia todo el contenido y pégalo en el SQL Editor de Supabase
5. Haz clic en **"Run"** (botón verde)
6. Deberías ver un mensaje de éxito — esto crea todas las 9 tablas

---

## Paso 4: Configurar Authentication

1. Ve a **Authentication** (ícono de llave) en la barra lateral
2. Ve a **Providers** en el menú lateral
3. Asegúrate de que **Email** esté habilitado
4. **IMPORTANTE para pruebas locales**: Ve a **Authentication → Settings**
   - Desactiva **"Confirm email"** para que no necesites verificar email en pruebas locales
   - Esto te permite registrar usuarios y usarlos inmediatamente

---

## Paso 5: Configurar URL del sitio

1. Ve a **Authentication → URL Configuration**
2. En **Site URL**, pon: `http://localhost:3000`
3. En **Redirect URLs**, agrega: `http://localhost:3000/auth/callback`
4. Haz clic en **Save**
