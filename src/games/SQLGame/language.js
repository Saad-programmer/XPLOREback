(() => {
  const storageKey = 'sql.language.v1';
  const translations = [
    ['Everything in this country is written down. You are the one who reads it.', 'Tout est consigné dans ce pays. À vous de lire les registres.'],
    ['63 lessons, both modes. You write the SQL; it marks it.', '63 leçons pour les deux modes. Écrivez vos requêtes SQL ; le jeu les évalue.'],
    ['Two jobs, both done in SQL: find one person in the records, or run a war from them. Nothing here is timed.', 'Deux missions, toutes deux en SQL : retrouver une personne dans les registres ou mener une guerre. Rien n’est chronométré.'],
    ['No SQL needed to begin. Both start from the first SELECT.', 'Pas besoin de connaître SQL pour commencer. Tout part du premier SELECT.'],
    ['From no SQL to a solved case, to read at your own pace. Every example runs.', 'De vos premiers pas en SQL à une affaire résolue, à votre rythme. Chaque exemple peut être exécuté.'],
    ['One person is hidden in the records. Find them in as few queries as you can. Easiest first.', 'Une personne se cache dans les registres. Retrouvez-la avec le moins de requêtes possible. Commencez par le plus simple.'],
    ['Three tables. The target stays put.', 'Trois tables. La cible ne bouge pas.'],
    ['Six tables. Witnesses, roads and regions. The target still stays put.', 'Six tables. Des témoins, des routes et des régions. La cible ne bouge toujours pas.'],
    ['The full schema. The target moves every turn and the witnesses are not all reliable.', 'Tout le schéma. La cible change de place à chaque tour et certains témoins mentent.'],
    ['The Agent tables, and clues no WHERE can answer alone: distances, orderings, runs.', 'Les tables Agent et des indices qu’un simple WHERE ne suffit pas à résoudre : distances, classements et suites.'],
    ['A war on a map of cities. Your orders are UPDATE and INSERT, and COMMIT ends the turn.', 'Une guerre sur une carte de villes. Donnez vos ordres avec UPDATE et INSERT, puis COMMIT termine le tour.'],
    ['3 maps, one rival more on each. Views you write carry to the next map.', '3 cartes, avec un rival de plus à chaque fois. Vos vues vous suivent sur la carte suivante.'],
    ['Somebody sent you a code or a seed? Paste it in the panel on the right.', 'On vous a envoyé un code ou une graine ? Saisissez-la dans le panneau à droite.'],
    ['Pick somebody, bury them under decoys, and send the code to a friend.', 'Choisissez une personne, cachez-la parmi des leurres et envoyez le code à un ami.'],
    ['A query that runs costs one turn, whether it returns one row or all of them.', 'Toute requête exécutée coûte un tour, qu’elle renvoie une ligne ou mille.'],
    ['A query that fails costs nothing. Read the error and fix it.', 'Une requête en erreur ne coûte rien. Lisez le message et corrigez-la.'],
    ['To name the target, return exactly one row with one column: their id from people.', 'Pour désigner la cible, renvoyez exactement une ligne et une colonne : son id dans people.'],
    ['A wrong name costs three extra turns.', 'Une mauvaise réponse coûte trois tours supplémentaires.'],
    ['Nothing is timed. Fewest turns wins, fewest rows scanned breaks ties.', 'Aucune limite de temps. Le moins de tours gagne ; le nombre de lignes lues départage les égalités.'],
    ['A case code they hid for you', 'Un code d’affaire à ouvrir'],
    ['Or a seed, to play the same case they did', 'Ou une graine pour jouer la même affaire'],
    ['Tier for this seed', 'Niveau de cette graine'],
    ['No streak yet. One attempt per tier, new at midnight UTC.', 'Aucune série pour le moment. Un essai par niveau, renouvellement à minuit UTC.'],
    ['started, still your one attempt', 'Commencée, tentative toujours en cours'],
    ['never used', 'jamais utilisé'],
    ['Reset', 'Réinitialiser'],
    ['The coach reads each query you run and says at most one thing about it. Off means off: no tip, nothing counted.', 'Le coach commente vos requêtes, une remarque au maximum par requête. Désactivé, il ne donne aucun conseil et ne compte rien.'],
    ['A query is a question about a table. SELECT says which columns you want back, FROM says which table to ask.', 'Une requête pose une question à une table. SELECT indique les colonnes à renvoyer ; FROM indique la table à consulter.'],
    ['Return the name and age of everyone in the file, in that order.', 'Renvoyez le nom et l’âge de chaque personne, dans cet ordre.'],
    ['Write a query and run it.', 'Écrivez une requête et exécutez-la.'],
    ['That is it.', 'C’est tout.'],
    ['Every query you write from here is this shape with more bolted on. The database hands back what you name and nothing else, which is why the column list is the first decision rather than an afterthought.', 'Chaque requête reprendra cette forme en y ajoutant de nouveaux éléments. La base renvoie uniquement les colonnes demandées : leur choix est donc la première décision, pas un détail.'],
    ['Next: Narrowing.', 'Suite : Affiner.'],
    ['3 hints, if you want them. The last one is the answer.', '3 indices sont disponibles. Le dernier donne la réponse.'],
    ['Show a hint', 'Afficher un indice'],
    ['SQLite. LIKE ignores case, || joins strings, and there is no ILIKE.', 'SQLite. LIKE ignore la casse, || assemble des textes et ILIKE n’existe pas.'],
    ['Read the case file, then start asking. Every query that runs costs one turn.', 'Lisez le dossier, puis posez vos questions. Toute requête exécutée coûte un tour.'],
    ['One of 126 people. What we know:', 'Une personne parmi 126. Voici les indices :'],
    ['Name them with a query that returns one row and one column: their id from people. Naming the wrong person costs 3 turns on top of the one the query cost.', 'Identifiez-la avec une requête qui renvoie une ligne et une colonne : son id dans people. Une erreur coûte 3 tours, en plus du tour de la requête.'],
    ['Does not live in their faction’s home city.', 'Ne vit pas dans la ville d’origine de sa faction.'],
    ['Does not live in their faction\'s home city.', 'Ne vit pas dans la ville d’origine de sa faction.'],
    ['Between 31 and 40 years old.', 'A entre 31 et 40 ans.'],
    ['Works as a merchant.', 'Travaille comme marchand.'],
    ['One rival, and room to make mistakes in. Learn what a turn costs before anyone makes you pay for it.', 'Un seul rival et le droit à l’erreur. Découvrez le coût d’un tour avant que quelqu’un vous le fasse payer.'],
    ['You have the Salt Union from here. Every order you give is a row, and rows are the only thing this country keeps.', 'Vous commandez l’Union du Sel. Chaque ordre est une ligne, et ce pays ne garde que des lignes.'],
    ['BEGIN opens a turn. Give your orders. COMMIT ends it and everything moves at once.', 'BEGIN ouvre un tour. Donnez vos ordres. COMMIT le termine et tout le monde joue en même temps.'],
    ['Turn open. Give orders, then COMMIT.', 'Tour ouvert. Donnez vos ordres, puis COMMIT.'],
    ['No orders given. The turn passed.', 'Aucun ordre donné. Le tour est passé.'],
    ['Your turn', 'Votre tour'],
    ['Your views', 'Vos vues'],
    ['The map', 'La carte'],
    ['The Border', 'La Frontière'],
    ['Lantern Guild (you)', 'Guilde des Lanternes (vous)'],
    ['One question worth asking twice is worth naming once. A view you make lasts the whole campaign.', 'Une question qu’on pose deux fois mérite un nom. Une vue créée reste disponible pendant toute la campagne.'],
    ['Nothing sighted. Your units report what is in the city they stand in or one road out, and a scout sees two. There is 1 rival out there.', 'Aucun ennemi repéré. Vos unités observent leur ville et les villes voisines ; un éclaireur voit à deux routes. Il reste un rival.'],
    ['Last seen', 'Dernière observation'],
    ['Objective', 'Objectif'],
    ['Cities. Whoever holds the most when the turns run out. Your score is your line in objective_score. Theirs you have to work out.', 'Villes. Le vainqueur en contrôle le plus à la fin. Votre score figure dans objective_score ; celui de l’ennemi est à découvrir.'],
    ['Turn 1 of 30. Iron counts only what is in cities you hold.', 'Tour 1 sur 30. Seul le fer des villes contrôlées est comptabilisé.'],
    ['3 statements, 0 units marching.', '3 ordres, 0 unite en marche.'],
    ['Everything', 'Tout'],
    ['Console', 'Console'],
    ['Schema', 'Schéma'],
    ['Asking', 'Interroger'],
    ['Hints', 'Indices'],
    ['Lessons', 'Leçons'],
    ['Case file', 'Dossier'],
    ['Turn log', 'Journal des tours'],
    ['Turns', 'Tours'],
    ['Turn', 'Tour'],
    ['Rows scanned', 'Lignes lues'],
    ['Game language', 'Langue du jeu'],
    ['Strength', 'Puissance'],
    ['Cities', 'Villes'],
    ['Rules', 'Règles'],
    ['Handbook', 'Manuel'],
    ['Run', 'Exécuter'],
    ['Play', 'Jouer'],
    ['Open', 'Ouvrir'],
    ['Menu', 'Menu'],
    ['New case', 'Nouvelle affaire'],
    ['New campaign', 'Nouvelle campagne'],
    ['Hide a case', 'Créer une affaire cachée'],
    ['Academy', 'Académie'],
    ['Seek rules', 'Regles de Seek'],
    ['Seek', 'Seek'],
    ['Command', 'Commandement'],
    ['With a friend', 'Avec un ami'],
    ['Learn', 'Apprendre'],
    ['Settings', 'Paramètres'],
    ['Daily', 'Quotidien'],
    ['Habits', 'Habitudes'],
    ['queries', 'requêtes'],
    ['0 of 1', '0 sur 1'],
    ['From a friend', 'Par un ami'],
    ['Continue', 'Continuer'],
    ['Reopen', 'Reprendre'],
    ['Resume', 'Reprendre'],
    ['unfinished', 'en cours : '],
    ['campaign', 'campagne'],
    ['phosphor', 'phosphore'],
    ['bloom', 'halo'],
    ['scanlines', 'lignes de balayage'],
    ['sound', 'son'],
    ['coach', 'aide'],
    ['green', 'vert'],
    ['amber', 'ambre'],
    ['not played yet', 'pas encore joué'],
    ['Found in 1 turn.', 'Trouvé en 1 tour.'],
    ['Target found', 'Cible trouvée'],
    ['Passed', 'Réussi'],
    ['Passed upstairs. What happens next is not recorded here.', 'Transmis aux etages superieurs. La suite ne figure pas dans ces registres.'],
    ['A lesson runs the real engine — nothing here is a simulation.', 'Chaque leçon utilise le vrai moteur SQL : rien n’est simulé.'],
    ['a lesson runs the real engine — nothing here is a simulation', 'une leçon utilise le vrai moteur SQL : rien n’est simulé'],
    ['real SQLite in your browser — no account — works offline', 'vrai SQLite dans votre navigateur — sans compte — fonctionne hors ligne'],
    ['j/k move', 'j/k déplacer'],
    ['enter select', 'entrée choisir'],
    ['tab everything else', 'tab autres commandes'],
    ['read only', 'lecture seule'],
    ['esc console', 'échap console'],
    ['Rookie', 'Recrue'],
    ['Agent', 'Agent'],
    ['Ghost', 'Fantôme'],
    ['Handler', 'Opérateur'],
    ['Indexes', 'Index'],
    ['Academy — Seek', 'Académie — Seek'],
    ['SELECT name, age FROM people WHERE ...', 'SELECT name, age FROM people WHERE ...'],
    ["WHERE throws away rows that do not interest you. Everything in Seek is narrowing: each query should rule out more people than the last.", 'WHERE écarte les lignes sans intérêt. Dans Seek, chaque requête doit affiner la recherche et éliminer davantage de personnes que la précédente.'],
    ['Return the name of every person over 60.', 'Renvoyez le nom de chaque personne de plus de 60 ans.'],
    ["Everything so far ran on SQLite. This stage runs on PostgreSQL, the database most jobs mean when they say SQL. The same world is loaded into it and nearly every query you have written works unchanged. What changes is how strict it is: a column has a type, and Postgres refuses to guess when the types do not fit, where SQLite would quietly pick something. Try SELECT 'age ' + age FROM people and read what comes back.", 'Jusqu’ici, les exercices utilisaient SQLite. Cette partie utilise PostgreSQL, la base de données à laquelle pensent la plupart des professionnels lorsqu’ils parlent de SQL. Le même univers y est chargé et presque toutes vos requêtes fonctionnent sans changement. Ce qui change, c’est sa rigueur : chaque colonne a un type, et PostgreSQL refuse de deviner si les types ne correspondent pas, contrairement à SQLite qui choisit parfois sans rien dire. Essayez SELECT \'age \' + age FROM people et lisez le résultat.'],
    ["Person 119, with a label: their name, and the text age 36 made by joining 'age ' to their age with ||, which is how text is joined.", 'Personne 119, avec une étiquette : son nom et le texte « age 36 », obtenu en reliant « age » à son âge avec ||, l’opérateur qui assemble les textes.'],
    ['Narrowing', 'Affiner les résultats'],
    ['Two conditions at once', 'Deux conditions à la fois'],
    ['Two tables', 'Deux tables'],
    ['A question inside a question', 'Une question dans une autre'],
    ['Naming them', 'Trouver leur identifiant'],
    ['Counting by kind', 'Compter par catégorie'],
    ['A join that runs and lies', 'Une jointure qui ment'],
    ['Measured against the file', 'Comparer au fichier'],
    ['What ON is for', 'Le rôle de ON'],
    ['Again: narrowing', 'Encore : affiner les résultats'],
    ['Again: two tables', 'Encore : deux tables'],
    ['Again: naming them', 'Encore : trouver leur identifiant'],
    ['Two hops', 'Deux étapes'],
    ['Keeping some of the groups', 'Garder certains groupes'],
    ['Never seen there', 'Jamais aperçu là-bas'],
    ['Both ends of a road', 'Les deux extrémités d’une route'],
    ['Counting people, not rows', 'Compter les personnes, pas les lignes'],
    ['The same answer for less', 'La même réponse, en plus court'],
    ['SCAN and SEARCH', 'SCAN et SEARCH'],
    ['One row for each match', 'Une ligne par correspondance'],
    ['The average that counted twice', 'Une moyenne qui compte double'],
    ['Again: counting per person', 'Encore : compter par personne'],
    ['Again: one road away', 'Encore : à une route de distance'],
    ['Again: an Agent case', 'Encore : une affaire Agent'],
    ['Read the rules', 'Lire les règles'],
    ['A turn is a transaction', 'Un tour est une transaction'],
    ['The whole army, one statement', 'Toute l’armée en une instruction'],
    ['Building without guessing', 'Construire sans deviner'],
    ['Name a question once', 'Nommer une requête une seule fois'],
    ['Orders that pick', 'Des ordres qui sélectionnent'],
    ['An order nobody heard', 'Un ordre ignoré'],
    ['An order that looks things up', 'Un ordre qui interroge la base'],
    ['Again: a whole turn', 'Encore : un tour complet'],
    ['What the map is fought over', 'L’enjeu de la carte'],
    ['Nothing is not a value', 'L’absence n’est pas une valeur'],
    ['Keeping the rows with no match', 'Garder les lignes sans correspondance'],
    ['The list with a hole in it', 'Une liste avec un trou'],
    ['Counting two things at once', 'Compter deux choses à la fois'],
    ['Naming a step', 'Nommer une étape'],
    ['The latest of each', 'Le plus récent pour chaque groupe'],
    ['The row before this one', 'La ligne précédente'],
    ['Following the roads', 'Suivre les routes'],
    ['The shortest way', 'Le chemin le plus court'],
    ['Again: a Handler case', 'Encore : une affaire Handler'],
    ['A way in', 'Un accès rapide'],
    ['The key nobody indexed', 'La clé sans index'],
    ['Two columns, one order', 'Deux colonnes, un ordre'],
    ['Never opening the table', 'Sans ouvrir la table'],
    ['An index left on the shelf', 'Un index inutilisé'],
    ['Already in order', 'Déjà trié'],
    ['Indexes again', 'Encore : les index'],
    ['Another engine', 'Un autre moteur'],
    ['Case counts now', 'La casse compte désormais'],
    ['One row per city', 'Une ligne par ville'],
    ['Counting with a condition', 'Compter sous condition'],
    ['Many rows, one line', 'Plusieurs lignes, un résultat'],
    ['Rows from nothing', 'Des lignes sans table source'],
    ['A subquery that can see out', 'Une sous-requête corrélée'],
    ['Reading the plan', 'Lire le plan d’exécution'],
    ['Two conditions, one index', 'Deux conditions, un index'],
    ['Never touching the table', 'Sans lire la table'],
    ['Postgres again', 'Encore : PostgreSQL'],
  ];

  const englishToFrench = new Map(translations);
  const frenchToEnglish = new Map(translations.map(([english, french]) => [french, english]));
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  let language = localStorage.getItem(storageKey) === 'fr' ? 'fr' : 'en';
  let queued = false;

  const css = document.createElement('style');
  css.textContent = `
    #language-picker { position: fixed; z-index: 10000; top: max(8px, env(safe-area-inset-top)); right: max(8px, env(safe-area-inset-right)); display: flex; padding: 2px; border: 1px solid var(--line, #1f6f45); background: var(--field, #070d0b); box-shadow: 0 0 12px #000b; }
    #language-picker button { min-width: 38px; min-height: 32px; padding: 4px 8px; border: 0; background: transparent; color: var(--fg, #39ff87); font: 700 12px/1 ui-monospace, monospace; cursor: pointer; }
    #language-picker button[aria-pressed="true"] { background: var(--fg, #39ff87); color: var(--bg, #05080a); }
    #language-picker button:focus-visible { outline: 2px solid var(--amber, #ffcf4d); outline-offset: 2px; }
    @media (max-width: 520px) { #language-picker { top: max(6px, env(safe-area-inset-top)); right: max(6px, env(safe-area-inset-right)); } }
  `;

  function translate(value) {
    const source = value.trim();
    const table = language === 'fr' ? englishToFrench : frenchToEnglish;
    if (table.has(source)) return value.replace(source, table.get(source));
    if (language === 'fr') {
      const sqliteRollback = source.match(/^SQLite: near "([^"]+)": syntax error The turn was rolled back\.$/);
      if (sqliteRollback) return value.replace(source, `SQLite : erreur de syntaxe près de « ${sqliteRollback[1]} ». Le tour a été annulé.`);
      const postgresTypeError = source.match(/^invalid input syntax for type integer: "(.+)"\.$/);
      if (postgresTypeError) return value.replace(source, `Valeur « ${postgresTypeError[1].trim()} » invalide pour un entier.`);
      const postgresCoach = source.match(/^'(.+)' is not an integer, and Postgres needed one there\. Types are checked before anything runs, so text never stands in for a number\.$/);
      if (postgresCoach) return value.replace(source, `« ${postgresCoach[1].trim()} » n’est pas un entier, alors que PostgreSQL en attend un ici. Les types sont vérifiés avant l’exécution : un texte ne remplace pas un nombre.`);
      const dailyHeading = source.match(/^Daily (\d{4}-\d{2}-\d{2})$/);
      if (dailyHeading) return value.replace(source, `Quotidien ${dailyHeading[1]}`);
      const dailyAction = source.match(/^(Continue|Play) (Rookie|Agent|Ghost|Handler) daily$/);
      if (dailyAction) {
        const action = dailyAction[1] === 'Continue' ? 'Continuer' : 'Jouer';
        return value.replace(source, `${action} ${englishToFrench.get(dailyAction[2])} du jour`);
      }
      const dailyCaseTitle = source.match(/^(Rookie|Agent|Ghost|Handler) daily, (\d{4}-\d{2}-\d{2})$/);
      if (dailyCaseTitle) return value.replace(source, `${englishToFrench.get(dailyCaseTitle[1])} du jour, ${dailyCaseTitle[2]}`);
      const savedCase = source.match(/^(?:Reopen )?unfinished(Rookie|Agent|Ghost|Handler) case (.+), where you left it\.$/i);
      if (savedCase) return value.replace(source, `Reprendre : affaire ${englishToFrench.get(savedCase[1])} ${savedCase[2]}, où vous en étiez.`);
      const savedCaseDetails = source.match(/^(Rookie|Agent|Ghost|Handler) case (.+), where you left it\.$/i);
      if (savedCaseDetails) return value.replace(source, `affaire ${englishToFrench.get(savedCaseDetails[1])} ${savedCaseDetails[2]}, où vous en étiez.`);
      const savedCampaign = source.match(/^(?:Resume )?unfinishedThe Border, campaign (.+)\.$/);
      if (savedCampaign) return value.replace(source, `Reprendre : campagne ${savedCampaign[1]}, La Frontière.`);
      const savedCampaignDetails = source.match(/^The Border, campaign (.+)\.$/);
      if (savedCampaignDetails) return value.replace(source, `campagne ${savedCampaignDetails[1]}, La Frontière.`);
      const campaignBattle = source.match(/^The Border — battle (\d+) of (\d+)$/);
      if (campaignBattle) return value.replace(source, `La Frontière — bataille ${campaignBattle[1]} sur ${campaignBattle[2]}`);
      const campaignFaction = source.match(/^You have the (.+) from here\. Every order you give is a row, and rows are the only thing this country keeps\.$/);
      if (campaignFaction) {
        const factions = { 'Lantern Guild': 'Guilde des Lanternes', 'Salt Union': 'Union du Sel' };
        const faction = factions[campaignFaction[1]] || campaignFaction[1];
        return value.replace(source, `À partir d’ici, vous commandez la ${faction}. Chaque ordre est une ligne ; ce pays ne conserve que des lignes.`);
      }
      const turnProgress = source.match(/^Turn (\d+) of (\d+)\. Iron counts only what is in cities you hold\.$/);
      if (turnProgress) return value.replace(source, `Tour ${turnProgress[1]} sur ${turnProgress[2]}. Seul le fer des villes que vous contrôlez est comptabilisé.`);
      const statementCount = source.match(/^(\d+) statements?, (\d+) units? marching\.$/);
      if (statementCount) {
        const orders = Number(statementCount[1]);
        const units = Number(statementCount[2]);
        return value.replace(source, `${orders} ${orders === 1 ? 'ordre exécuté' : 'ordres exécutés'}, ${units} ${units === 1 ? 'unité en marche' : 'unités en marche'}.`);
      }
      if (source === 'Not started. BEGIN opens it.') return value.replace(source, 'Pas commencé. BEGIN ouvre le tour.');
      if (source === 'A question worth asking twice is worth naming once. A view you make lasts the whole campaign.') {
        return value.replace(source, 'Une question qu’on pose deux fois mérite un nom. Une vue créée reste disponible pendant toute la campagne.');
      }
      const turnCount = source.match(/^Turn (\d+)\.$/);
      if (turnCount) return value.replace(source, `Tour ${turnCount[1]}.`);
      const reopened = source.match(/^Case reopened at turn (\d+)\.$/);
      if (reopened) return value.replace(source, `Affaire reprise au tour ${reopened[1]}.`);
      const wrongPerson = source.match(/^Wrong person\. One turn for the query, (\d+) more for the name you sent up\.$/);
      if (wrongPerson) return value.replace(source, `Mauvaise personne. La requête coûte un tour, puis ${wrongPerson[1]} tours de pénalité.`);
      const caseRequester = source.match(/^Requested by the (.+)\.$/);
      if (caseRequester) return value.replace(source, `Demandé par ${caseRequester[1]}.`);
      const cityClue = source.match(/^Lives in a city of more than ([\d,]+) people\.$/);
      if (cityClue) return value.replace(source, `Vit dans une ville de plus de ${cityClue[1]} habitants.`);
      const factionCity = source.match(/^Their faction's home city is (.+)\.$/);
      if (factionCity) return value.replace(source, `La ville d’origine de sa faction est ${factionCity[1]}.`);
      const occupation = source.match(/^Works as a (.+)\.$/);
      if (occupation) {
        const professions = { guard: 'garde', merchant: 'marchand', soldier: 'soldat', spy: 'espion', scholar: 'érudit', farmer: 'fermier', sailor: 'marin', blacksmith: 'forgeron', healer: 'guérisseur', priest: 'prêtre' };
        return value.replace(source, `Travaille comme ${professions[occupation[1].toLowerCase()] || occupation[1]}.`);
      }
      const rowCount = source.match(/^(\d+) rows?(\.)?$/);
      if (rowCount) return value.replace(source, `${rowCount[1]} ${Number(rowCount[1]) === 1 ? 'ligne' : 'lignes'}${rowCount[2] || ''}`);
      const scanCount = source.match(/^Scanned (\d+) rows?, (\d+) engine steps?\.$/);
      if (scanCount) {
        const scanned = Number(scanCount[1]);
        const steps = Number(scanCount[2]);
        return value.replace(source, `${scanned} ${scanned === 1 ? 'ligne lue' : 'lignes lues'}, ${steps} ${steps === 1 ? 'étape moteur' : 'étapes moteur'}.`);
      }
      const progress = source.match(/^(\d+) of (\d+) passed\. Carry on where you left off\.$/);
      if (progress) {
        const count = Number(progress[1]);
        return value.replace(source, `${count} leçon${count === 1 ? '' : 's'} sur ${progress[2]} réussie${count === 1 ? '' : 's'}. Reprenez où vous en étiez.`);
      }
      const fraction = source.match(/^(\d+) of (\d+)$/);
      if (fraction) return value.replace(source, `${fraction[1]} sur ${fraction[2]}`);
      const count = source.match(/^(\d+) (Rookie|Agent|Ghost|Handler) case(s?) behind you\./);
      if (count) {
        const tier = englishToFrench.get(count[2]);
        return value.replace(source, `${count[1]} affaire${count[3] ? 's' : ''} ${tier} terminee${count[3] ? 's' : ''}.`);
      }
      const turn = source.match(/^Turn (\d+) resolved\. It is turn (\d+)\.$/);
      if (turn) return value.replace(source, `Tour ${turn[1]} termine. Le tour ${turn[2]} commence.`);
      const rows = source.match(/^(\d+) rows?\. Scanned (\d+) rows?, (\d+) engine steps?\.$/);
      if (rows) {
        const [resultCount, scannedCount, stepCount] = rows.slice(1).map(Number);
        const resultLabel = resultCount === 1 ? 'ligne' : 'lignes';
        const scannedLabel = scannedCount === 1 ? 'ligne lue' : 'lignes lues';
        const stepLabel = stepCount === 1 ? 'étape moteur' : 'étapes moteur';
        return value.replace(source, `${resultCount} ${resultLabel}. ${scannedCount} ${scannedLabel}, ${stepCount} ${stepLabel}.`);
      }
    }
    return value;
  }

  function applyTranslations() {
    queued = false;
    document.documentElement.lang = language;
    const root = document.getElementById('app');
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const current = node.nodeValue;
      let record = originalText.get(node);
      if (!record || current !== record.translated) record = { source: current, translated: current };
      const translated = translate(record.source);
      if (translated !== current) node.nodeValue = translated;
      record.translated = translated;
      originalText.set(node, record);
    }
    root.querySelectorAll('[aria-label], [placeholder], [title]').forEach((element) => {
      for (const attribute of ['aria-label', 'placeholder', 'title']) {
        if (element.hasAttribute(attribute)) {
          const value = element.getAttribute(attribute);
          let records = originalAttributes.get(element);
          if (!records) {
            records = new Map();
            originalAttributes.set(element, records);
          }
          let record = records.get(attribute);
          if (!record || value !== record.translated) record = { source: value, translated: value };
          const translated = translate(record.source);
          if (translated !== value) element.setAttribute(attribute, translated);
          record.translated = translated;
          records.set(attribute, record);
        }
      }
    });
    document.querySelectorAll('#language-picker button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    const picker = document.getElementById('language-picker');
    if (picker) picker.setAttribute('aria-label', language === 'fr' ? 'Langue du jeu' : 'Game language');
  }

  function scheduleTranslations() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(applyTranslations);
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    localStorage.setItem(storageKey, language);
    scheduleTranslations();
  }

  function start() {
    document.head.append(css);
    const picker = document.createElement('nav');
    picker.id = 'language-picker';
    picker.setAttribute('aria-label', language === 'fr' ? 'Langue du jeu' : 'Game language');
    picker.innerHTML = '<button type="button" data-language="en" aria-pressed="true" title="English">EN</button><button type="button" data-language="fr" aria-pressed="false" title="Français">FR</button>';
    picker.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-language]');
      if (button) setLanguage(button.dataset.language);
    });
    document.body.append(picker);
    new MutationObserver(scheduleTranslations).observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'placeholder', 'title'],
    });
    scheduleTranslations();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();