# La Goffinerie — le site, section par section

Résumé de **https://lagoffinerie.be** tel qu'il est en ligne le 6 octobre 2026 (version 2.24), pour en discuter.
Chaque section donne : son rôle, ce qu'elle dit (textes français réels), ce qui bouge, et les points encore ouverts.

- Site statique bilingue FR/EN (le visiteur choisit en haut à droite ; sa langue est retenue), hébergé sur GitHub Pages, domaine chez OVH.
- Public visé : artisans, commerces et indépendants en Belgique (PME en Europe plus largement).
- Promesse : des sites web, des applications et de petits programmes **qui travaillent pour vous** — prix fixe, pas d'abonnement, le client possède tout.
- Back-office : **Jarvis** (jarvis.ndashiz.be) reçoit l'audience et les demandes, envoie les e-mails de confirmation, et pilote trois réglages du site (intro 3D du logo, écran de maintenance, bannière d'annonce).

---

## 0. Ce qui est commun à toutes les pages

**Barre du haut (fixe, translucide à 66 % + flou)** : logo + « La Goffinerie » · Ce que je fais · Réalisations · Tarifs · À propos · FAQ · sélecteur EN/FR · bouton **Appel gratuit** (ouvre la fenêtre de réservation).
Sur téléphone : logo, EN/FR, Appel gratuit, et une **barre du bas** fixe : Appeler · Réalisations · Tarifs · Contact.

**Pied de page** : Mentions légales · CGU · Protection des données · Cookies · info@lagoffinerie.be · « © 2026 La Goffinerie · Basée en Belgique. » (jamais de mention d'IA ni de ville).

**Fenêtre de réservation (modale)** — s'ouvre depuis tous les boutons « Réserver mon appel gratuit » / « Appel gratuit », et toute seule après 60 s de présence réelle (une fois par onglet).
- Titre « Réserver un appel gratuit de 30 minutes », intro « Racontez-moi comment vous travaillez aujourd'hui — je vous dirai honnêtement ce qui vaut la peine d'être automatisé, et ce que ça peut rapporter. »
- Champs : Votre nom · Votre email · En quoi puis-je vous aider ? (ex. « Un site web avec facturation automatique ») · Quel jour puis-je vous appeler ? (jours ouvrables, J+1 → J+60) · À quelle heure ? (créneaux de 30 min, 9h → 20h) · Téléphone (optionnel) · Autre chose à savoir ? (optionnel).
- Note sous le formulaire : « Je réponds personnellement sous un jour ouvrable. Vos coordonnées ne servent qu'à vous recontacter. »
- À l'envoi : **la fenêtre se plie en avion de papier qui décolle**, puis la confirmation se déplie : « Créneau proposé : … — Je vous le confirme par e-mail sous un jour ouvrable », avec « Ajouter à Google Agenda » et « Fichier .ics ». La demande part à Jarvis (qui envoie deux e-mails : à Simon et au prospect, avec l'invitation d'agenda) ; si Jarvis ne peut pas envoyer, FormSubmit prend le relais.
- Bouton « Choisir un créneau maintenant » (prise de rendez-vous en ligne) : **masqué tant que l'adresse de réservation n'est pas configurée**.

**Intro 3D du logo** (accueil seulement) : les trois formes arrivent en blocs 3D, forment le logo et se rangent dans la barre ; une fois par onglet ; activable et réglable en vitesse depuis Jarvis ; jamais pour qui a demandé moins d'animations.

**Animations transversales** : apparition des sections au défilement, cartes en cascade, formes du logo qui dérivent dans le héros. Tout est coupé avec `prefers-reduced-motion`.

---

## 1. Accueil (`/`)

### 1.1 Héros
- Accroche : **Sites web, applications & petits programmes · Belgique**
- Titre (le premier mot tourne toutes les 2,6 s, chacun dans une couleur du logo, et la forme du logo de la même couleur gonfle à l'entrée du mot) :
  **Des sites web** (bleu, le carré) / **Des applications** (rouge, le rond) / **De petits programmes** (ocre, le triangle) **qui travaillent pour vous.** (soulignement bleu dessiné à la main)
  Anglais : « I build websites / apps / small programs that get to work for you. »
- Sous-titre : « Un site qui remplit votre agenda, envoie vos factures et vous dit ce que font vos visiteurs. Prix fixe, pas d'abonnement. **Il vous appartient.** »
- Ligne d'audience : « Pour les artisans, commerces et indépendants en Belgique » + pastilles Électricien · Salon de coiffure · Cabinet · Restaurant.
- Boutons : **Réserver mon appel gratuit** · Voir nos réalisations →
- Note : « 30 minutes, sans engagement. Je vous dirai honnêtement ce qui vaut la peine d'être construit — et ce que ça peut rapporter à votre entreprise. » puis « Ou joignez-moi directement : +32 479 48 76 08 · WhatsApp ».
- (La bannière jaune défilante qui suivait le héros a été retirée le 6 octobre.)

### 1.2 Ce que je construis (`#alive`)
- Titre : **Une brochure, c'est du poids mort. Un site vivant, ça rapporte.**
- Intro : « Chaque site que je livre est soigné — ça, c'est le ticket d'entrée. La différence, c'est ce qu'il *fait* pour vous une fois l'onglet fermé. »
- Six cartes (étiquette · titre · texte) :
  1. Intégration · **Parle à votre Odoo** — Demandes, contacts et factures arrivent directement dans le CRM que vous utilisez déjà — sans copier-coller, sans lead perdu.
  2. Intégration · **Remplit votre agenda** — Vos clients choisissent un créneau sur votre site et il atterrit dans votre agenda. Fini les allers-retours pour trouver une date.
  3. IA · **Lit votre boîte mail pour vous** — Un digest IA résume vos interactions clients et messages non lus en un court briefing matinal — rien ne passe à la trappe les jours chargés.
  4. IA · **Fait le travail ennuyeux** — Devis préparés, factures générées à la clôture d'un chantier, relances envoyées. Votre site gère l'administratif que vous faites à 22h.
  5. Visibilité · **Des analytics à vous** — Chaque visite et chaque clic capturés dans votre propre tableau de bord privé — rien n'est expédié chez un tiers. Comprenez ce que veulent vos visiteurs, en langage clair.
  6. Option · **Être trouvé sur Google** — Une couche SEO en option : structure, vitesse et contenu optimisés pour que ceux qui cherchent votre métier vous trouvent vraiment.

### 1.3 Réalisations — carrousel (`#work`)
- Titre : **Du vrai travail, pour de vraies entreprises.** — « Des sites et des outils qui tournent chaque jour : des projets clients, et un projet personnel. Quelques-uns, en une minute. »
- Cinq cartes (image, étiquette, nom, résumé, bouton « Voir le cas → » vers la page Réalisations), défilement automatique toutes les 6 s, flèches et points :
  1. Client · Électricien — **Bravo Reno** : Un site moderne que le client gère lui-même : des contenus qu'il modifie sans outil technique, une campagne SEO locale, et des demandes de contact qui arrivent par e-mail et créent un lead automatiquement.
  2. Client · Syndic bénévole — **LazySyndic** : Transactions suivies et catégorisées automatiquement, rapports financiers générés, convocations d'assemblée envoyées et décisions signées en ligne : toute la gestion d'un syndic bénévole au même endroit.
  3. Client · Investisseur — **Henry** : Une vue consolidée de tous ses comptes de placement : plusieurs plateformes réunies dans une seule interface, un historique tenu à jour automatiquement, et un rapport chaque matin avec l'actualité de ses actifs.
  4. Client · PME informatique — **Scrum Poker** : Un jeu en ligne pour estimer les tâches en équipe : chacun propose une complexité avec la suite de Fibonacci, les estimations sont comparées, et l'historique des scores aide à gagner en précision.
  5. Projet perso · 3D — **Virtual Coffee** : Un CV interactif en 3D : entrez dans le café, prenez la chaise en face de moi, et je vous raconte mon parcours de vive voix.
- Lien : « Toutes les réalisations, en détail → »

### 1.4 Comment ça marche — version courte (`#process`)
- Titre : **Quatre étapes, et vous validez chacune.** (les étapes s'allument tour à tour)
  1. **Appel gratuit** — 30 minutes pour comprendre comment vous travaillez aujourd'hui, et ce qui vaut la peine d'être construit.
  2. **Plan & prix fixe** — Ce qui sera livré, par écrit, pour un seul prix. Rien ne démarre sans votre feu vert.
  3. **Construction ouverte** — Vous suivez l'avancement chaque semaine et testez sur du vrai travail avant la livraison.
  4. **Remise des clés** — Le code, les données et les clés sont à vous. Un mois de support, défauts corrigés gratuitement six mois.
- Lien : « La méthode et les tarifs, en détail → » (page Tarifs)

### 1.5 FAQ (`#faq`) — 11 questions dépliables (balisées FAQPage pour Google)
- Titre : **Les réponses que je donne à chaque premier appel.**
1. **Combien de temps prend un projet ?** — La plupart des projets prennent entre trois et six semaines, du premier appel à la remise des clés, selon les intégrations. Vous voyez l'avancement chaque semaine et validez chaque étape.
2. **Combien ça coûte ?** — Un prix fixe, convenu par écrit avant de commencer, juste après l'appel gratuit. Pas d'abonnement, pas de frais par utilisateur, pas de surprise ensuite.
3. **Que dois-je fournir ?** — Vos textes et photos (ou les notes que nous prenons ensemble à l'appel), votre logo si vous en avez un, et les accès aux outils que le site doit utiliser, comme votre agenda ou Odoo. Je m'occupe du reste.
4. **J'ai déjà un site. Pouvez-vous partir de là ?** — Oui. Je garde ce qui fonctionne (contenu, nom de domaine, référencement) et je reconstruis ce qui vous freine. Votre adresse ne change pas, et l'ancien site reste en ligne jusqu'à ce que le nouveau soit prêt.
5. **Faut-il utiliser Odoo ?** — Non. Odoo est un exemple de ce à quoi le site peut se connecter. Ça marche aussi bien avec votre agenda, votre outil de facturation ou un simple tableur, et ça marche sans aucun d'eux.
6. **Qui fait le travail ?** — Moi, du premier appel à la remise des clés. Pas d'agence, pas de sous-traitance : une personne qui connaît votre projet.
7. **Aujourd'hui, n'importe qui peut demander un site à l'IA. Pourquoi faire confiance au vôtre ?** — Bonne question. L'IA me rend rapide, mais la vitesse ne vaut rien si votre site tombe un samedi ou laisse fuiter votre fichier clients. J'ai passé les six dernières années à livrer des solutions digitales pour des acteurs majeurs en Belgique, où les pannes et les fuites de données ne sont pas une option. Cette discipline accompagne chaque projet : supervisé et mis à jour sans interruption, protégé contre les attaques courantes, une base de données sécurisée et sauvegardée, et une remise des clés documentée et testée.
8. **Que se passe-t-il après la livraison ?** — Un mois de support général est inclus, et tout défaut est corrigé gratuitement pendant six mois. Toute nouveauté fait d'abord l'objet d'un petit devis, donc jamais de surprise.
9. **À qui appartient le site ?** — À vous : le code, les données et tous les accès. Vous pouvez l'emporter où vous voulez, le confier à quelqu'un d'autre ou le modifier vous-même, avec ou sans moi.
10. **Comment se passe le paiement ?** — Un acompte au démarrage et le solde à la livraison, sur facture. Les prix s'entendent hors TVA.
11. **Dans quelles langues ?** — Français, anglais et néerlandais pour nos échanges. Le site lui-même peut être en une langue ou en plusieurs.

### 1.6 Contact (`#contact`)
- Titre : **Dites-moi ce qui mange votre temps.** — « Un appel gratuit de 30 minutes. Racontez-moi comment vous travaillez aujourd'hui — je vous dirai honnêtement ce qui vaut la peine d'être automatisé, et ce que ça peut rapporter. »
- Bouton **Réserver mon appel gratuit** (ouvre la fenêtre), note « Choisissez un jour et une heure dans la fenêtre qui s'ouvre ; je confirme sous un jour ouvrable. »
- Trois faits : Je réponds sous un jour ouvrable · Appels en semaine, de 9h à 20h · Basé en Belgique, au service des PME en Europe.
- Carte « Ou joignez-moi directement » : Appeler +32 479 48 76 08 · WhatsApp (M'écrire un message) · E-mail info@lagoffinerie.be · LinkedIn.

---

## 2. Réalisations (`/work.html`)
- En-tête : « Ils nous font confiance » — **Du vrai travail, pour de vraies entreprises.** — « Pas des maquettes : des sites et des outils qui tournent chaque jour. Les voici, un par un, en commençant par un client. » + pastilles de navigation vers les cinq cas.
- Chaque cas = une grande capture, un badge, un titre, le nom (lien quand il y en a un), une ligne « qui », des pastilles d'outils, puis le texte.

1. **Étude de cas — Électricien · Bravo Reno** (bravoreno.be ↗ · Électricien & serrurier · Wallonie & Bruxelles) — *Un site moderne, que le client gère lui-même.*
   Pastilles : Contentful · Hébergement · SEO local · Leads automatiques · Google Analytics.
   Texte : Bravo Reno est le site d'un professionnel spécialisé dans les services d'électricité et de serrurerie. Pour ce projet, nous avons mis en place une interface publique moderne et classique, ainsi qu'une interface d'administration complète qui permet au client de gérer lui-même le contenu et le fonctionnement de son site. **Les principales fonctionnalités mises en place :** 1. Des contenus modifiables par le client (Contentful) · 2. L'hébergement du site (sur nos propres serveurs) · 3. Une campagne SEO locale (région de Huy) · 4. La gestion des demandes de contact (e-mail + lead créé automatiquement) · 5. Google Analytics.
2. **Étude de cas — Syndic bénévole · LazySyndic** (ndashiz.be/lazysyndic ↗ · Plateforme de gestion de copropriété · en production) — *La copropriété en pilote automatique.*
   Pastilles : Transactions & catégories · Rapports financiers · Convocations d'AG · Signature électronique.
   Texte : Mon client est syndic bénévole. Afin de faciliter et d'automatiser la gestion de la copropriété, nous lui avons créé un site web centralisant l'ensemble des tâches liées à la gestion du syndic. **La plateforme permet notamment de :** 1. Gérer les transactions financières · 2. Générer automatiquement des rapports financiers · 3. Automatiser les invitations aux assemblées générales · 4. Centraliser les décisions et conclusions des AG (signature électronique).
3. **Étude de cas — Investisseur · Henry** (Module de suivi de portefeuille · plusieurs plateformes, une seule interface) — *Tous ses placements, dans une seule vue.*
   Pastilles : Vue consolidée · Rapport quotidien · Historique automatique · Actualité financière.
   Texte : Mise en place d'un module permettant à un client d'avoir une vue consolidée de l'ensemble de ses comptes de placement. Le client utilisait plusieurs plateformes d'investissement ; nous les avons intégrées afin que les données de son portefeuille soient récupérées et mises à jour automatiquement au sein d'une interface unique. L'objectif : une vue end-to-end de ses investissements, sans devoir se connecter à plusieurs plateformes, en suivant ses propres indicateurs. **Le module permet notamment de :** 1. Recevoir un rapport quotidien personnalisé · 2. Automatiser le suivi de l'historique · 3. Intégrer l'actualité financière (Yahoo). Capture : interface réelle sur un portefeuille d'exemple fictif.
4. **Étude de cas — PME informatique · Scrum Poker** (ndashiz.be/scrumpoker ↗ · Outil d'estimation pour l'équipe d'une PME informatique) — *L'estimation d'équipe, transformée en jeu.*
   Pastilles : Poker Scrum · Suite de Fibonacci · Estimations partagées · Historique des scores.
   Texte : Mise en place d'une interface en ligne permettant aux collaborateurs d'une équipe d'estimer collectivement des tâches grâce à un jeu interactif, basé sur le principe du Poker Scrum et la suite de Fibonacci ; estimations comparées pour aboutir à une estimation commune ; consultation des estimations des autres et historique des scores. Demande formulée par un chef d'équipe d'une PME spécialisée dans l'informatique. Tuiles : Fibonacci · Ensemble · Historique · Équipe.
5. **Projet perso — Expérience 3D · Virtual Coffee** (ndashiz.be/virtualcoffee ↗ · Mon CV sous forme de café dans lequel on entre) — *Un CV interactif en 3D, avec une voix.*
   Pastilles : Three.js · 3D dans le navigateur · Voix · Contrôle à un doigt.
   Texte : **La situation.** Un CV se lit en quarante secondes. Je voulais qu'un recruteur passe dix minutes avec moi à la place. **Ce que j'ai construit.** Un café en 3D : vous entrez, vous prenez la chaise en face de moi, et je vous raconte mon parcours de vive voix pendant que le CV est posé sur la table… **Ce que ça change pour vous** : ça montre l'autre bout de ce que je construis. Quand un site doit être une expérience, pas une brochure.

- Bas de page : encart « Votre entreprise, le prochain cas ? » + Réserver mon appel gratuit.

---

## 3. Tarifs & méthode (`/pricing.html`)
- En-tête : **Un prix fixe, connu avant de commencer.** — « Trois points de départ, une méthode, et ce sur quoi vous pouvez compter après la livraison. Le prix exact est fixé par écrit après l'appel gratuit, et il ne bouge plus ensuite. Prix hors TVA. » + pastilles Formules · Méthode · Garanties.

### 3.1 Combien ça coûte — **Trois points de départ.**
- « Chaque formule est un point de départ : nous la précisons ensemble à l'appel, puis je vous donne un prix fixe unique, par écrit. »
- **Site vitrine** — *Prix fixe, fixé après l'appel gratuit* — Un site propre et rapide qui amène des demandes : une à cinq pages, formulaire de contact, pensé mobile d'abord, pages légales faites, en ligne dès le premier jour.
- **Site vivant** (« La plus choisie ») — *Prix fixe, fixé après l'appel gratuit* — Le site vitrine plus une ou deux intégrations qui travaillent pour vous : réservation d'agenda, factures automatiques, votre CRM, un tableau de bord privé. Formation incluse.
- **Sur mesure** — *Sur devis* — Outils internes, automatisations IA, plusieurs sites ou un système à vous. Nous le cadrons ensemble, puis je le chiffre en un prix fixe.
- Note : « Après la livraison : pas de licence, pas de frais par utilisateur, pas d'abonnement. Le prix convenu est le prix payé. »
- **Chaque projet comprend** : Pensé pour le téléphone d'abord, rapide sur tous les écrans · Un périmètre écrit et un prix fixe avant de commencer · Les pages légales faites · Une formation pour l'utiliser, et le modifier vous-même · La documentation et tous les accès remis : c'est à vous · Un mois de support, défauts corrigés gratuitement pendant six mois.
- ⚠ Les montants « à partir de » ne sont pas encore renseignés : les cartes affichent « Prix fixe, fixé après l'appel gratuit » tant que `config.js` n'a pas de prix.

### 3.2 La méthode Goffinerie — **Rien de plus, rien de moins — et c'est à vous.**
1. **01 — Exactement ce qu'il vous faut · Une solution, construite autour de vous** — Je conçois autour de votre façon de travailler — un seul endroit pour tout, pas de zapping entre applis, pas de fonctions que vous n'avez pas demandées.
2. **02 — Pas d'abonnements · Payez une fois. C'est tout.** — Un prix fixe, convenu avant de construire. Après la livraison, pas de licence, pas de frais par utilisateur, pas d'abonnement.
3. **03 — On le fait ensemble → vous le faites vous-même · Je vous remets les clés** — Nous cadrons et construisons la solution ensemble. Étape par étape, vous prenez la main — jusqu'à être capable de l'utiliser, la faire tourner, et même la modifier vous-même avec les outils IA.

### 3.3 Comment ça marche — **Transparent du premier rendez-vous à la remise des clés.**
- « Vous validez chaque étape. Vous voyez tout. Et vous testez la solution vous-même — le jour de la livraison, vous savez déjà la faire tourner. »
- Rail animé de six étapes (avance toutes les 5 s, pause au survol, clic sur une étape), chaque étape avec son texte et son dessin au trait :
  1. **On se rencontre** — Un appel d'introduction gratuit pour comprendre vos besoins et votre façon de travailler.
  2. **On valide le plan** (étiquette « Vous validez ») — Je propose une approche, je définis exactement ce qui sera livré, et je vous donne un prix fixe unique. Rien ne démarre sans votre feu vert.
  3. **On conçoit** — Architecture complète et documentation — le plan sur lequel nous travaillons tous les deux.
  4. **On construit, en toute transparence** — Vous suivez l'avancement en continu. En chemin, je vous forme à utiliser — et modifier — ce qui se construit.
  5. **Vous testez** — Vous utilisez la solution sur du vrai travail avant la livraison. Ce qui ne convient pas est corrigé.
  6. **Livraison & remise des clés** — C'est à vous — le code, les données, et les clés. Vous pouvez la faire tourner, et avec les outils IA, même la modifier vous-même.
- Pastilles de support : 1 mois de support général inclus · Défauts corrigés gratuitement pendant 6 mois · Hors périmètre ? Un devis de change request clair d'abord.

### 3.4 Ce sur quoi vous pouvez compter — **La discipline de six ans en environnement exigeant.**
- « L'IA me rend rapide — mais la vitesse ne vaut rien si votre site tombe un samedi ou laisse fuiter votre fichier clients. Chaque projet hérite des habitudes prises en livrant des solutions digitales pour des acteurs majeurs en Belgique : »
- Fiabilité · **Conçu pour rester en ligne** — Supervisé en continu, mis à jour sans interruption, et un plan pour quand ça tourne mal — par conception, pas par bonne volonté.
- Sécurité · **Blindé contre les attaques** — HTTPS partout, protection contre les attaques courantes et les bots de spam qui visent chaque jour les sites de petites entreprises.
- Vos données · **Base de données verrouillée & sauvegardée** — Vos données clients sont stockées dans une base sécurisée, avec une solution de sauvegarde automatisée en option — un incident ne signifie jamais repartir de zéro.
- Discipline · **Des habitudes de livraison bancaires** — Documenté, testé, et transmis proprement. Les mêmes standards que j'applique en menant des équipes de delivery dans le secteur financier.

### 3.5 Appel final
- **Dites-moi ce qui mange votre temps.** — « Un appel gratuit de 30 minutes, sans engagement. Le prix exact arrive juste après, par écrit. » — Réserver mon appel gratuit · téléphone · WhatsApp · LinkedIn · « D'autres questions ? Lire la FAQ → »

---

## 4. À propos (`/about.html`)
- « Qui est derrière » — **Simon Goffin — fondateur** — « Passionné par la transformation digitale et par la livraison de solutions. Le pont entre l'IT et le métier en grande entreprise, aujourd'hui au service des PME en Europe. »
- Photo + bio en trois phrases :
  1. Depuis des années, je fais le pont entre l'IT et le métier en grande entreprise, avec la charge de plusieurs applications de bout en bout : **design utilisateur, architecture d'intégration, tests, budget**.
  2. Pour tenir dans un environnement très exigeant, j'ai construit mes propres outils pour automatiser ce qui pouvait l'être. **« Automate the boring, dominate the important »** est devenu ma devise.
  3. Aujourd'hui, je livre des solutions digitales en indépendant complémentaire pour des **PME partout en Europe** : une seule personne, du premier appel à la remise des clés.
- **Comment on travaille ensemble** (six faits sur trois colonnes) : Je réponds sous un jour ouvrable · Appels en semaine, de 9h à 20h · Trois à six semaines par projet · Français, anglais et néerlandais · Basé en Belgique, actif partout en Europe · Tout par écrit.
- Appel final : **Dites-moi ce qui mange votre temps.** — Réserver mon appel gratuit · téléphone · WhatsApp · LinkedIn.
- (Aucune certification ni formation n'est citée, volontairement.)

---

## 5. Pages légales
- **Mentions légales** (`/mentions-legales.html`) : Éditeur · Propriété intellectuelle · Non-responsabilité · Droit à l'image · Vie privée · Droit applicable. ⚠ Numéro BCE / TVA et adresse encore **à compléter**.
- **CGU** (`/cgu.html`) : 11 articles (objet, mentions légales, accès aux services, formation du contrat, responsabilité, propriété intellectuelle, données personnelles, liens, évolution, durée, droit applicable).
- **Protection des données** (`/donnees-personnelles.html`) : traitement, finalités et bases légales, divulgation à des tiers, durée de conservation (demandes : 24 mois max, à valider), vos droits.
- **Cookies** (`/cookies.html`) : aucun cookie propre ; liste des valeurs gardées dans le navigateur (langue, pop-up vu, appareils de Simon exclus des statistiques, intro du logo jouée et son réglage, état du site et bannière fermée) ; mesure d'audience sans tiers ; tiers contactés (Google Fonts, Jarvis, FormSubmit en repli).

---

## 6. Les états du site (pilotés depuis Jarvis)
- **Page 404** (`/404.html`, servie par GitHub Pages) : « Erreur 404 — Cette page n'existe pas — ou plus. L'adresse a peut-être changé, ou le lien était cassé. Rien de grave : voici les sorties. » + Retour à l'accueil · Voir les réalisations · Tarifs · À propos · FAQ · Me contacter. Dessin : un écran qui affiche l'erreur, son câble coupé en deux.
- **Écran de maintenance** : quand l'interrupteur est activé dans Jarvis, chaque page se couvre d'un écran plein : « Maintenance — Le site revient très vite. Je fais une mise à jour, et je ne ferme jamais longtemps. En attendant, vous pouvez me joindre directement. » + téléphone, WhatsApp, e-mail ; un ouvrier casqué martèle une barrière de chantier (boucle animée) ; **jamais d'heure de retour annoncée, pas de bouton Réessayer** ; la page se re-vérifie toutes les 60 s et s'efface d'elle-même. Titre et message modifiables (FR/EN) depuis Jarvis. Repli : si Jarvis ne répond pas, le site s'affiche normalement.
- **Bannière d'annonce** : un bandeau au-dessus de la barre du haut, sur toutes les pages, en trois tons (information bleu, attention jaune, urgent rouge), texte FR/EN jusqu'à 120 caractères, lien facultatif, période du/au, croix pour la fermer pendant la visite. Exemple prévu : « Congés du 24 au 31 décembre — les demandes reçues pendant la fermeture ont une réponse le 2 janvier. Réserver un créneau en janvier → »
- ⚠ Les deux réglages existent côté Jarvis en version 1.88.0, **à déployer sur le serveur** pour devenir actifs ; d'ici là le site n'affiche ni l'un ni l'autre.

---

## 7. Mesure et prospects
- Chaque page envoie à Jarvis des événements anonymes (page vue, sections atteintes, clics sur les boutons) sans aucun traceur tiers ; les appareils de Simon sont exclus.
- Les demandes de la fenêtre de réservation arrivent dans Jarvis (page « La Goffinerie » : audience, prospects avec statut et note, réglages du site) et déclenchent les e-mails de confirmation.
- Un assistant de conversation (« Simon, dessiné ») est en cours de construction dans une autre session ; il n'est pas en ligne.

---

## 8. Points encore ouverts (à trancher)
1. **Prix « à partir de »** des trois formules et **adresse de prise de rendez-vous** : non renseignés → les cartes disent « Prix fixe, fixé après l'appel gratuit » et le bouton « Choisir un créneau maintenant » reste masqué.
2. **Mentions légales** : numéro BCE / TVA et adresse à compléter (Simon n'est pas encore inscrit à la BCE).
3. **Odoo** : l'accueil le met en avant (carte « Parle à votre Odoo », question de la FAQ) alors que plus aucun cas client ne le montre depuis la réécriture de Bravo Reno.
4. **Hébergement** : le cas Bravo Reno parle d'« hébergement sur nos propres serveurs » alors que le reste du site ne mentionne volontairement pas l'hébergement.
5. **« Nous » vs « je »** : les textes des cas clients disent « nous », le reste du site parle à la première personne.
6. **Henry** : le mot « Investisseur » pour le type de client est un choix provisoire ; la dernière phrase du texte fourni (sur la présentation visuelle) n'a pas été publiée.
7. **Scrum Poker** : présenté comme un cas client mais le lien pointe vers ndashiz.be/scrumpoker.
8. **Néerlandais** : site FR/EN seulement ; la décision d'ajouter le NL est en attente.
9. **Durée de conservation** des demandes (24 mois) à valider dans la politique de données.
10. **Témoignage / chiffres** du cas Bravo Reno : pas encore fournis.
