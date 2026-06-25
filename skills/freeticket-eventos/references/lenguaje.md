# Lenguaje de FreeTicket

Guía de voz y copy para todo lo que ve el usuario final (comprador u organizador).

## Principio

**Español neutro, cercano y claro.** Tratamiento de **tú** o impersonal.
**Nunca voseo.** Sin tecnicismos: el comprador no sabe qué es un "webhook",
una "preventa con gate" ni un "QR firmado" — habla de beneficios, no de
implementación.

| ❌ Evita (voseo / técnico) | ✅ Usa (neutro / claro) |
|---|---|
| "Creá tu evento" / "Iniciá sesión" | "Crea tu evento" / "Inicia sesión" |
| "Comprá tu entrada" | "Compra tu entrada" |
| "El webhook confirmó tu pago" | "Tu pago quedó confirmado" |
| "Activá el gate de preventa" | "Activa la preventa para tus miembros" |
| "Token DRM del contenido" | "Contenido exclusivo para miembros" |

## Título del evento

- Claro y específico: **nombre del artista/evento + gancho**, no relleno.
- Sin MAYÚSCULAS sostenidas ni signos repetidos ("!!!").
- Que se entienda fuera de contexto (aparece en listados y buscadores).

Ej.: ✅ "Noche de Boleros — Trío Los Tres, en vivo" · ❌ "EL MEJOR SHOW!!!"

## Descripción (`description`)

Estructura sugerida (2–4 párrafos cortos o viñetas):
1. **Qué es** y para quién (1 frase con personalidad).
2. **Qué vas a vivir:** artistas, repertorio, experiencia.
3. **Datos prácticos:** lo esencial sin repetir la ficha (fecha/venue ya salen aparte).

Tono: invita, no grita. Frases cortas. Beneficio antes que logística.

## Recomendaciones del ticket (`recommendations`)

Campo **obligatorio**. Es lo que el asistente debe saber/llevar:
- Qué incluye la entrada (y qué no).
- Recomendaciones prácticas: llegar temprano, llevar documento, código de
  vestimenta, restricciones de edad, accesibilidad.
- Una línea por ítem, accionable.

Ej.: "Incluye acceso general de pie. Llega 30 min antes. Ingreso solo con
documento. Mayores de 18 años."

## Microcopy y estados

- Errores en segunda persona y con salida: "No pudimos procesar tu pago. Intenta
  de nuevo o usa otro medio."
- Confirmaciones cálidas: "¡Listo! Tu entrada está en tu correo y en *Mis entradas*."
- Botones con verbo de acción: "Comprar entrada", "Ver evento", "Hacerme miembro".

## Marca

- Nombre del producto: **FreeTicket** (una palabra, F y T mayúsculas).
- Colores de marca (referencia, no para copy): `#FFD500` `#07C2BA` `#F03372` `#8505DC`.
- Moneda por defecto: **COP** (formatea con separador de miles, sin decimales si es entero).
