# FreeTicket brand language

Voice and copy system for everything the end user sees — buyer, fan, or
artist/organizer. Distilled from FreeTicket's internal brand & copy system
(marketing team's "Sistema de Copy con IA" and B2B messaging docs).

> These instructions are in English, but **the copy you produce is in Spanish**,
> because FreeTicket's audience is LATAM (Colombia-first). The examples below are
> intentionally in Spanish — that is the output, not a translation gap.

## The voice: two archetypes

FreeTicket's brand personality blends two archetypes. Every piece of marketing
copy should feel like it came from this character:

- **The Jester (el bufón):** irreverent, playful, clever double meaning. Provokes
  without vulgarity. Makes you laugh but has substance.
- **The Explorer (el explorador):** a rockstar — different, doesn't follow the
  rules of traditional entertainment. Has attitude.

In practice the tone is:

- **Colombian and street-smart, but elegant.**
- **Double meaning when it fits — never forced.**
- **Direct.** No filler, no corporate speak.
- **Confident.** Doesn't ask anyone for permission.
- **Fun, but never clownish.**

What FreeTicket is **NEVER**:

- Formal or institutional.
- Generic ("ven y disfruta").
- Over-explanatory.
- Boring.
- **A bank.** No "tienes beneficios pendientes", no "exclusivo para miembros",
  no "beneficio disponible". If a bank could have written it, rewrite it.

Brand references: Red Bull, Vans, old-school MTV — irreverent, rockstar, color
on a black base. Product references: Dice.fm, Weverse, Bandcamp, NTS Radio.

### Reference lines (real brand copy, keep as calibration)

> Donde entra la risa entra la longaniza
> De eso tan bueno sí dan tanto
> Como te gusta, a cada rato y en cualquier lugar
> "Mitad de mes y esto ya parece un festival 🔥 … Puro talento en tarima, cero relleno."
> "Si no aparecemos en Google es porque así lo queremos, ¿ok? (Mentiras, manden ayuda🥺)"
> "Ya pagaste, ¿pa' qué esperar?"
> "Estos son tuyos. 🎤"

## Two registers, one brand

The archetypes are always there, but the *dosage* depends on the surface:

| Register | Surfaces | Dosage |
|---|---|---|
| **Marketing voice** | Social posts, push notifications, WhatsApp campaigns, ads, video | Full jester + explorer. Slang and wordplay welcome (`chimba`, `parche`, `pa'`), FOMO, urgency. |
| **Product voice** | Event fields (title/description/recommendations), UI microcopy, errors, confirmations, help | The brand's confidence and warmth, minus the slang. Clear beats clever. A joke never costs comprehension. |

**Both registers share hard rules:**

- **Tú or impersonal. Never voseo** ("creá/comprá/iniciá" ❌ → "crea/compra/inicia" ✅).
  Colloquial Colombian contractions ("pa'") are fine in the marketing register only.
- **No tech jargon.** The buyer doesn't know what a "webhook", a "presale gate" or
  a "signed QR" is — talk benefits, not implementation.

| ❌ Avoid (voseo / technical / bank-speak) | ✅ Use |
|---|---|
| "Creá tu evento" / "Iniciá sesión" | "Crea tu evento" / "Inicia sesión" |
| "El webhook confirmó tu pago" | "Tu pago quedó confirmado" |
| "Activá el gate de preventa" | "Activa la preventa para tus miembros" |
| "Token DRM del contenido" | "Contenido exclusivo para miembros" |
| "Tienes beneficios pendientes" | "Tienes un ticket esta semana. No lo dejes vencer." |
| "Ya puedes reservar, disponible ahora" | "Acaban de abrir 8 shows este mes. Corre." |
| "Ven y disfruta" | Anything specific. Never this. |

## Event fields (product voice)

### Title

- Clear and specific: **artist/event name + hook**, no filler.
- No sustained ALL CAPS or repeated punctuation ("!!!").
- Understandable out of context (it appears in listings and search).

E.g.: ✅ "Noche de Boleros — Trío Los Tres, en vivo" · ❌ "EL MEJOR SHOW!!!"

### Description (`description`)

Suggested structure (2–4 short paragraphs or bullets):
1. **What it is** and for whom (1 line with personality — this is where the brand voice peeks in).
2. **What you'll experience:** artists, repertoire, the vibe.
3. **Practical info:** the essentials without repeating fixed fields (date/venue show separately).

Tone: invite, don't shout. Short sentences. Benefit before logistics.

### Ticket recommendations (`recommendations`)

**Mandatory** field. What the attendee should know/bring:
- What the ticket includes (and what it doesn't).
- Practical tips: arrive early, bring ID, dress code, age limits, accessibility.
- One actionable line per item.

E.g.: "Incluye acceso general de pie. Llega 30 min antes. Ingreso solo con
documento. Mayores de 18 años."

## Push notifications (marketing voice, hard limits)

- **Title: ≤ 50 characters** (aim ≤ 5 words), direct, with a hook.
- **Body: ≤ 60 characters** — what fits in the unexpanded preview on iOS/Android.
- Show-drop format for the body: `Comediante · Día · Venue · CTA corto`.
- Goal is **soft urgency + belonging**: the user feels the tickets are theirs and
  going fast. Don't say "miembro"/"exclusivo" — make them *feel* it.
- Sound like a launch, not an announcement: avoid "disponible", "ya puedes reservar".

Calibration examples:

| Title | Body |
|---|---|
| Estos son tuyos. 🎤 | Juan Peláez "Negro" · Sábado 8pm · Descárgalos ya. 🎟️ |
| Esta semana sí o no 👀 | Los tickets no esperan. Los shows, tampoco. |
| El mes ya tiene plan | [Venue] acaba de soltar su programación. ¿Vas? |

## Social & campaign formats (marketing voice)

- **Event recap:** celebration + FOMO — "te lo perdiste, pero el viernes vuelve a
  pasar". Short: ≤ 3 lines + CTA.
- **Membership promo:** "ya tienes lo gratis, ahora imagínate con todo" —
  temptation, never pressure. Hook first, explanation after.
- **Specific show:** soft urgency + vibe + FOMO. Short in stories, medium in feed.
- **Behind the scenes:** warmer, more jester, like talking to your crew ("el parche").
- **WhatsApp:** a tip from a friend, not an ad. ≤ 3 lines including the link;
  open with a question or short hook; direct CTA + link at the end.
- Every piece ends with a **clear CTA in brand tone** (action verbs: "Comprar
  entrada", "Ver evento", "Hacerme miembro").

## Help & tutorial content

FreeTicket explains simple things with **deadpan mock-solemnity**: a 70s
institutional-documentary tone applied to trivial tasks (reference: Troy McClure).
The humor lives in the **contrast** — no explicit jokes, the seriousness does the
work. Steps themselves must still be dead clear: "Tu ticket tiene un código QR.
Ese código es tu entrada. Lo escanean en la puerta. Y listo."

## B2B voice (artists, venues, producers)

When writing for organizers/artists (pitch, onboarding, landing copy), the story
is **ownership of the community**, not features:

- Core idea: *"Que te vean no es lo mismo que ser conocido."* Your fans exist,
  but they live on platforms that belong to someone else. **"Tu comunidad ya
  existe. Solo necesita un lugar."**
- Freeticket is "el lugar donde vive tu comunidad" — *not* "una tiquetera",
  *not* "otra red social". The artist is the host; the fans are truly theirs.
- Benefits over features; short declarative lines; second person.
- Plans are named **Spark → Star → Icon** ("Empieza gratis con Spark…").
- **Don't** talk about money passing through intermediaries.
- **Don't** limit the copy to Colombia or to comedians — it applies to any live
  artist, any market.

## Microcopy and states (product voice)

- Errors in second person with a way out: "No pudimos procesar tu pago. Intenta de
  nuevo o usa otro medio."
- Warm confirmations: "¡Listo! Tu entrada está en tu correo y en *Mis entradas*."
- Buttons with action verbs: "Comprar entrada", "Ver evento", "Hacerme miembro".

## Brand facts

- Product name: **FreeTicket** (one word, capital F and T). Domain: `freeticket.us`.
- Brand colors (reference, not for copy): `#FFD500` yellow · `#8505DC` purple ·
  `#07C2BA` turquoise · `#F03372` pink, on `#070707` black. Typography: Roc Grotesk.
- Default currency: **COP** (thousands separator, no decimals when integer).

## Litmus test (run before delivering copy)

1. Could a bank or a generic ticketing site have written this? → rewrite.
2. Any voseo conjugation? → fix to tú.
3. Tech jargon a buyer wouldn't know? → translate to benefit.
4. Does it end with a clear CTA (when the surface needs one)?
5. Marketing register: does it have attitude? Product register: is it instantly clear?
