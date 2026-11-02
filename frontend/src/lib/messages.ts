import type { Catalogue } from "@dome-layer/dome-ui";

/**
 * LLM Council's own words in the site's four languages (roadmap row 6). English is the source type,
 * so a key missing from another language fails the type check. Register as on the site: voi in
 * Italian, u in Dutch, Sie in German. Model names (Claude, Gemini, Chat-GPT) and "Council" stay as
 * they are; what the panel writes follows the language through the backend's `output_language`.
 */

export type MemberId = "claude" | "gemini" | "openai";
export type HumanInLoop = "not_required" | "recommended" | "required" | "completed";

const en = {
  page: {
    eyebrow: "Multi-model deliberation",
    title: "Ask the Panel",
    lead: "Three AI advisors deliberate independently, then cross-examine each other, producing a governed verdict with a confidence score and full audit trail.",
  },
  form: {
    label: "Submit a question to the Panel",
    placeholder:
      "Submit any question that benefits from multiple expert perspectives: strategy, risk, investment decisions, operational trade-offs…",
    submit: "Deliberate",
    submitting: "Deliberating",
  },
  status: {
    convening: "Convening the Panel…",
    deliberating: "Deliberating…",
    rounds: {
      1: {
        headline: "The Panel is forming independent positions",
        sub: "Each advisor deliberates independently, with no cross-examination yet.",
      },
      2: {
        headline: "The Panel is conducting cross-examination",
        sub: "Advisors are reviewing initial positions and refining their assessments.",
      },
      3: {
        headline: "Synthesising the verdict",
        sub: "Weighing confidence scores, consensus patterns, and dissenting views.",
      },
    },
    facts: [
      "Claude serves as Strategic Advisor, focused on long-term implications and systemic risks.",
      "The Critical Advisor's role is to challenge consensus and surface blind spots.",
      "Gemini's Research Analyst role prioritises data integrity and structured reasoning.",
      "Round 2 is sequential: each advisor reviews the others' Round 1 positions before responding.",
      "Each advisor returns a confidence score from 0 to 1 with its position.",
      "A confidence score below 0.65 automatically triggers a human-in-loop recommendation.",
      "The governance log records a SHA-256 hash of the input for full auditability.",
      "The Chief Synthesis Advisor produces the final verdict by weighing all six responses across both rounds.",
    ],
  },
  members: {
    claude: { role: "Strategic Advisor", thinking: "The Strategic Advisor is weighing long-term implications…" },
    gemini: { role: "Research Analyst", thinking: "The Research Analyst is structuring the evidence…" },
    openai: { role: "Critical Advisor", thinking: "The Critical Advisor is stress-testing assumptions…" },
  } satisfies Record<MemberId, { role: string; thinking: string }>,
  panel: {
    members: "Panel members",
    convening: "Convening the Panel…",
  },
  card: {
    readFull: "Read full response ↗",
    round: (n: number) => `Round ${n}`,
    confidence: "Confidence",
    close: "Close",
  },
  verdict: {
    eyebrow: "Panel verdict",
    consensus: "Consensus confidence",
    recommendation: "Recommendation",
    dissent: "Dissenting views",
    auditLog: "Audit log:",
    rulesApplied: "Rules applied:",
    save: "Save deliberation",
    saving: "Saving…",
    saved: "Saved",
    saveFailed: "Failed to save",
    saveError: "Could not save. Please try again.",
  },
  governance: {
    not_required: "Autonomous",
    recommended: "Review recommended",
    required: "Human required",
    completed: "Human reviewed",
  } satisfies Record<HumanInLoop, string>,
  library: {
    eyebrow: "Library",
    title: "Saved deliberations",
    loading: "Loading",
    error: "Error",
    loadFailed: "Failed to load saved deliberations.",
    empty: "No saved deliberations yet. Complete a deliberation and save it to see it here.",
    back: "← Back to Council",
    consensus: (pct: string) => `${pct} consensus`,
    view: "View",
    delete: "Delete",
    confirm: "Confirm",
    cancel: "Cancel",
    deleting: "Deleting…",
    savedOn: (date: string) => `Saved ${date}`,
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    connection: "Connection failed",
  },
  globalError: {
    title: "Something went wrong",
    retry: "Try again",
  },
  nav: {
    saved: "Saved",
  },
};

export type Messages = typeof en;

const it: Messages = {
  page: {
    eyebrow: "Deliberazione tra più modelli",
    title: "Chiedete al panel",
    lead: "Tre consulenti AI deliberano in modo indipendente, poi esaminano a vicenda le proprie posizioni e producono un verdetto governato, con un punteggio di affidabilità e una traccia di audit completa.",
  },
  form: {
    label: "Sottoponete una domanda al panel",
    placeholder:
      "Qualsiasi domanda che tragga vantaggio da più punti di vista esperti: strategia, rischio, decisioni di investimento, compromessi operativi…",
    submit: "Avvia la deliberazione",
    submitting: "Deliberazione in corso",
  },
  status: {
    convening: "Il panel si sta riunendo…",
    deliberating: "Deliberazione in corso…",
    rounds: {
      1: {
        headline: "Il panel sta formando posizioni indipendenti",
        sub: "Ogni consulente delibera da solo, ancora senza confronto con gli altri.",
      },
      2: {
        headline: "Il panel sta esaminando le posizioni a vicenda",
        sub: "I consulenti rivedono le posizioni iniziali e affinano le proprie valutazioni.",
      },
      3: {
        headline: "Sintesi del verdetto",
        sub: "Si pesano i punteggi di affidabilità, il grado di consenso e le opinioni dissenzienti.",
      },
    },
    facts: [
      "Claude è il Consulente strategico: guarda alle implicazioni di lungo periodo e ai rischi sistemici.",
      "Il Consulente critico ha il compito di mettere in discussione il consenso e far emergere i punti ciechi.",
      "Gemini, come Analista di ricerca, dà priorità all'integrità dei dati e a un ragionamento strutturato.",
      "Il secondo round è sequenziale: ogni consulente legge le posizioni del primo round degli altri prima di rispondere.",
      "Ogni consulente indica, insieme alla propria posizione, un punteggio di affidabilità da 0 a 1.",
      "Un'affidabilità inferiore a 0,65 fa scattare automaticamente la raccomandazione di una revisione umana.",
      "Il registro di governance conserva un hash SHA-256 dell'input, per una piena verificabilità.",
      "Il Consulente capo di sintesi formula il verdetto finale pesando tutte e sei le risposte dei due round.",
    ],
  },
  members: {
    claude: { role: "Consulente strategico", thinking: "Il Consulente strategico sta valutando le implicazioni di lungo periodo…" },
    gemini: { role: "Analista di ricerca", thinking: "L'Analista di ricerca sta ordinando le evidenze…" },
    openai: { role: "Consulente critico", thinking: "Il Consulente critico sta mettendo alla prova le ipotesi…" },
  },
  panel: {
    members: "Membri del panel",
    convening: "Il panel si sta riunendo…",
  },
  card: {
    readFull: "Leggi la risposta completa ↗",
    round: (n: number) => `Round ${n}`,
    confidence: "Affidabilità",
    close: "Chiudi",
  },
  verdict: {
    eyebrow: "Verdetto del panel",
    consensus: "Affidabilità del consenso",
    recommendation: "Raccomandazione",
    dissent: "Opinioni dissenzienti",
    auditLog: "Registro di audit:",
    rulesApplied: "Regole applicate:",
    save: "Salva la deliberazione",
    saving: "Salvataggio…",
    saved: "Salvata",
    saveFailed: "Salvataggio non riuscito",
    saveError: "Impossibile salvare. Riprovate.",
  },
  governance: {
    not_required: "Autonomo",
    recommended: "Revisione consigliata",
    required: "Intervento umano richiesto",
    completed: "Revisionato da una persona",
  },
  library: {
    eyebrow: "Archivio",
    title: "Deliberazioni salvate",
    loading: "Caricamento",
    error: "Errore",
    loadFailed: "Impossibile caricare le deliberazioni salvate.",
    empty: "Nessuna deliberazione salvata. Completate una deliberazione e salvatela per ritrovarla qui.",
    back: "← Torna al Council",
    consensus: (pct: string) => `${pct} di consenso`,
    view: "Apri",
    delete: "Elimina",
    confirm: "Conferma",
    cancel: "Annulla",
    deleting: "Eliminazione…",
    savedOn: (date: string) => `Salvata il ${date}`,
  },
  errors: {
    generic: "Qualcosa è andato storto. Riprovate.",
    connection: "Connessione non riuscita",
  },
  globalError: {
    title: "Qualcosa è andato storto",
    retry: "Riprova",
  },
  nav: {
    saved: "Salvate",
  },
};

const nl: Messages = {
  page: {
    eyebrow: "Deliberatie tussen meerdere modellen",
    title: "Vraag het panel",
    lead: "Drie AI-adviseurs beraadslagen eerst elk afzonderlijk en toetsen daarna elkaars standpunten. De uitkomst is een beheerst oordeel met een betrouwbaarheidsscore en een volledig auditspoor.",
  },
  form: {
    label: "Leg een vraag voor aan het panel",
    placeholder:
      "Elke vraag die baat heeft bij meerdere deskundige perspectieven: strategie, risico, investeringsbeslissingen, operationele afwegingen…",
    submit: "Start de deliberatie",
    submitting: "Deliberatie loopt",
  },
  status: {
    convening: "Het panel komt bijeen…",
    deliberating: "Deliberatie loopt…",
    rounds: {
      1: {
        headline: "Het panel vormt onafhankelijke standpunten",
        sub: "Elke adviseur beraadslaagt zelfstandig, nog zonder onderlinge toetsing.",
      },
      2: {
        headline: "Het panel toetst elkaars standpunten",
        sub: "De adviseurs bekijken de eerste standpunten en scherpen hun beoordeling aan.",
      },
      3: {
        headline: "Het oordeel wordt samengesteld",
        sub: "Betrouwbaarheidsscores, mate van overeenstemming en afwijkende standpunten worden gewogen.",
      },
    },
    facts: [
      "Claude is de Strategisch adviseur, gericht op gevolgen op lange termijn en systeemrisico's.",
      "De Kritisch adviseur moet de consensus uitdagen en blinde vlekken blootleggen.",
      "Gemini legt als Onderzoeksanalist de nadruk op betrouwbare gegevens en gestructureerd redeneren.",
      "Ronde 2 is opeenvolgend: elke adviseur leest eerst de standpunten van de anderen uit ronde 1.",
      "Elke adviseur geeft bij zijn standpunt een betrouwbaarheidsscore van 0 tot 1.",
      "Een betrouwbaarheid onder 0,65 leidt automatisch tot het advies om een mens te laten meekijken.",
      "Het governancelogboek bewaart een SHA-256-hash van de invoer, zodat alles controleerbaar blijft.",
      "De Hoofdadviseur synthese weegt alle zes antwoorden uit beide rondes en formuleert het eindoordeel.",
    ],
  },
  members: {
    claude: { role: "Strategisch adviseur", thinking: "De Strategisch adviseur weegt de gevolgen op lange termijn…" },
    gemini: { role: "Onderzoeksanalist", thinking: "De Onderzoeksanalist ordent het bewijs…" },
    openai: { role: "Kritisch adviseur", thinking: "De Kritisch adviseur zet de aannames onder druk…" },
  },
  panel: {
    members: "Panelleden",
    convening: "Het panel komt bijeen…",
  },
  card: {
    readFull: "Volledig antwoord lezen ↗",
    round: (n: number) => `Ronde ${n}`,
    confidence: "Betrouwbaarheid",
    close: "Sluiten",
  },
  verdict: {
    eyebrow: "Oordeel van het panel",
    consensus: "Betrouwbaarheid van de consensus",
    recommendation: "Aanbeveling",
    dissent: "Afwijkende standpunten",
    auditLog: "Auditlog:",
    rulesApplied: "Toegepaste regels:",
    save: "Deliberatie opslaan",
    saving: "Opslaan…",
    saved: "Opgeslagen",
    saveFailed: "Opslaan mislukt",
    saveError: "Opslaan is niet gelukt. Probeer het opnieuw.",
  },
  governance: {
    not_required: "Autonoom",
    recommended: "Controle aanbevolen",
    required: "Mens vereist",
    completed: "Door een mens gecontroleerd",
  },
  library: {
    eyebrow: "Bibliotheek",
    title: "Opgeslagen deliberaties",
    loading: "Laden",
    error: "Fout",
    loadFailed: "Opgeslagen deliberaties konden niet worden geladen.",
    empty: "Nog geen opgeslagen deliberaties. Rond een deliberatie af en sla die op om hem hier terug te vinden.",
    back: "← Terug naar de Council",
    consensus: (pct: string) => `${pct} consensus`,
    view: "Bekijken",
    delete: "Verwijderen",
    confirm: "Bevestigen",
    cancel: "Annuleren",
    deleting: "Verwijderen…",
    savedOn: (date: string) => `Opgeslagen op ${date}`,
  },
  errors: {
    generic: "Er is iets misgegaan. Probeer het opnieuw.",
    connection: "Verbinding mislukt",
  },
  globalError: {
    title: "Er is iets misgegaan",
    retry: "Opnieuw proberen",
  },
  nav: {
    saved: "Opgeslagen",
  },
};

const de: Messages = {
  page: {
    eyebrow: "Beratung mehrerer Modelle",
    title: "Fragen Sie das Gremium",
    lead: "Drei KI-Berater beraten zunächst unabhängig und prüfen dann gegenseitig ihre Positionen. Das Ergebnis ist ein gesteuertes Urteil mit Konfidenzwert und vollständigem Prüfpfad.",
  },
  form: {
    label: "Stellen Sie dem Gremium eine Frage",
    placeholder:
      "Jede Frage, die von mehreren Expertenperspektiven profitiert: Strategie, Risiko, Investitionsentscheidungen, operative Zielkonflikte…",
    submit: "Beratung starten",
    submitting: "Beratung läuft",
  },
  status: {
    convening: "Das Gremium tritt zusammen…",
    deliberating: "Beratung läuft…",
    rounds: {
      1: {
        headline: "Das Gremium bildet unabhängige Positionen",
        sub: "Jeder Berater urteilt für sich, noch ohne gegenseitige Prüfung.",
      },
      2: {
        headline: "Das Gremium prüft die Positionen gegenseitig",
        sub: "Die Berater sichten die ersten Positionen und schärfen ihre Einschätzungen.",
      },
      3: {
        headline: "Das Urteil wird zusammengeführt",
        sub: "Konfidenzwerte, Grad der Übereinstimmung und abweichende Meinungen werden gewichtet.",
      },
    },
    facts: [
      "Claude ist der Strategische Berater und achtet auf langfristige Folgen und systemische Risiken.",
      "Der Kritische Berater stellt den Konsens infrage und deckt blinde Flecken auf.",
      "Gemini legt als Research-Analyst Wert auf Datenqualität und strukturiertes Denken.",
      "Runde 2 läuft nacheinander: Jeder Berater liest vor seiner Antwort die Positionen der anderen aus Runde 1.",
      "Jeder Berater gibt zu seiner Position einen Konfidenzwert von 0 bis 1 an.",
      "Eine Konfidenz unter 0,65 löst automatisch die Empfehlung einer menschlichen Prüfung aus.",
      "Das Governance-Protokoll speichert einen SHA-256-Hash der Eingabe, damit alles nachprüfbar bleibt.",
      "Der Leitende Synthese-Berater wägt alle sechs Antworten aus beiden Runden ab und fällt das Urteil.",
    ],
  },
  members: {
    claude: { role: "Strategischer Berater", thinking: "Der Strategische Berater wägt langfristige Folgen ab…" },
    gemini: { role: "Research-Analyst", thinking: "Der Research-Analyst ordnet die Belege…" },
    openai: { role: "Kritischer Berater", thinking: "Der Kritische Berater prüft die Annahmen auf Herz und Nieren…" },
  },
  panel: {
    members: "Mitglieder des Gremiums",
    convening: "Das Gremium tritt zusammen…",
  },
  card: {
    readFull: "Vollständige Antwort lesen ↗",
    round: (n: number) => `Runde ${n}`,
    confidence: "Konfidenz",
    close: "Schließen",
  },
  verdict: {
    eyebrow: "Urteil des Gremiums",
    consensus: "Konfidenz des Konsenses",
    recommendation: "Empfehlung",
    dissent: "Abweichende Meinungen",
    auditLog: "Prüfprotokoll:",
    rulesApplied: "Angewandte Regeln:",
    save: "Beratung speichern",
    saving: "Wird gespeichert…",
    saved: "Gespeichert",
    saveFailed: "Speichern fehlgeschlagen",
    saveError: "Speichern nicht möglich. Bitte versuchen Sie es erneut.",
  },
  governance: {
    not_required: "Autonom",
    recommended: "Prüfung empfohlen",
    required: "Mensch erforderlich",
    completed: "Von einem Menschen geprüft",
  },
  library: {
    eyebrow: "Bibliothek",
    title: "Gespeicherte Beratungen",
    loading: "Wird geladen",
    error: "Fehler",
    loadFailed: "Gespeicherte Beratungen konnten nicht geladen werden.",
    empty: "Noch keine gespeicherten Beratungen. Schließen Sie eine Beratung ab und speichern Sie sie, um sie hier zu finden.",
    back: "← Zurück zum Council",
    consensus: (pct: string) => `${pct} Konsens`,
    view: "Ansehen",
    delete: "Löschen",
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    deleting: "Wird gelöscht…",
    savedOn: (date: string) => `Gespeichert am ${date}`,
  },
  errors: {
    generic: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    connection: "Verbindung fehlgeschlagen",
  },
  globalError: {
    title: "Etwas ist schiefgelaufen",
    retry: "Erneut versuchen",
  },
  nav: {
    saved: "Gespeichert",
  },
};

export const MESSAGES: Catalogue<Messages> = { en, it, nl, de };
