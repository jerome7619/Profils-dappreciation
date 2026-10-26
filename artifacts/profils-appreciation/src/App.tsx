import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Copy,
  HeartHandshake, Mail, Printer, RotateCcw, ShieldCheck, Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type SurveyKind = 'famille' | 'travail';
type Category = { id: string; label: string; short: string; color: string; intro: string; examples: string[]; hurts?: string[]; note?: string; noteLabel?: string };
type AnswerOption = { text: string; categoryId: string };
type Question = { prompt: string; options: AnswerOption[] };
type Result = { kind: SurveyKind; answers: Record<number, string>; scores: Record<string, number>; primary: string; secondary: string; leaders?: string[]; percentages: Record<string, number>; completedAt: string };
type SavedSurvey = { answers: Record<number, string>; result?: Result };

const FRENCH_BOOK_URL = 'https://www.leslibraires.ca/livres/5-langages-de-l-amour-les-gary-chapman-9782848992723.html';
const OFFICIAL_QUIZ_URL = 'https://5lovelanguages.com/quizzes/love-language';
const PUBLIC_APP_URL = 'https://profils-dappreciation-one.vercel.app/';

function surveyUrlFor(kind: SurveyKind) {
  return `${PUBLIC_APP_URL}/sondage-${kind}`;
}

const familyCategories: Category[] = [
  { id: 'parole', label: 'Paroles valorisantes', short: 'Les mots qui comptent', color: '#315e52', intro: 'Les personnes de cette catégorie se sentent aimées lorsqu’elles reçoivent des encouragements, des compliments, de la reconnaissance ou des mots d’appréciation.', examples: ['« Je suis fier·ère de toi. »', '« Merci pour tout ce que tu fais. »', '« J’apprécie ta présence. »'], hurts: ['Les critiques constantes.', 'Les paroles dures ou humiliantes.', 'Le manque de reconnaissance.'] },
  { id: 'temps', label: 'Moments de qualité', short: 'Une présence attentive', color: '#cf8067', intro: 'Pour ces personnes, l’attention complète vaut beaucoup. La présence et le temps partagé comptent davantage que les cadeaux ou les gestes matériels.', examples: ['Partager un repas sans téléphone.', 'Faire une promenade ensemble.', 'Avoir une conversation profonde.'], hurts: ['L’indifférence.', 'Les distractions constantes.', 'Les annulations répétées.'] },
  { id: 'attentions', label: 'Cadeaux', short: 'Un signe qui vous ressemble', color: '#bd9b43', intro: 'Il ne s’agit pas de valeur monétaire : un cadeau peut représenter une preuve tangible que l’autre a pensé à vous.', examples: ['Recevoir une fleur cueillie lors d’une promenade.', 'Garder un souvenir rapporté d’un voyage.', 'Recevoir un objet choisi avec attention.'], hurts: ['L’oubli des occasions importantes.', 'Le manque d’attentions symboliques.'] },
  { id: 'aide', label: 'Services rendus', short: 'Un geste qui allège', color: '#70959a', intro: 'Ces personnes ressentent l’amour à travers des actions concrètes qui leur facilitent la vie.', examples: ['Se faire préparer un repas.', 'Recevoir de l’aide pour une réparation.', 'Voir une tâche difficile prise en charge.'], hurts: ['Les promesses non tenues.', 'Le manque de collaboration.', 'Avoir l’impression que les efforts ne sont pas partagés.'] },
  { id: 'affection', label: 'Toucher physique souhaité', short: 'Une proximité consentie', color: '#a57b91', intro: 'L’affection peut se transmettre par un contact physique respectueux et approprié, seulement lorsqu’il est souhaité. Le consentement et les limites de chacun·e passent avant toute préférence.', examples: ['Recevoir un câlin si chaque personne le souhaite.', 'Se tenir la main si cela convient à tout le monde.', 'Partager une proximité réconfortante et désirée.'], hurts: ['Le manque de proximité peut parfois être ressenti comme une distance.', 'Un refus doit toujours être respecté : aucune marque d’affection n’est due.'] },
];
const familyQuestions: Question[] = [
  {
    prompt: 'Je me sens le plus aimé·e quand…',
    options: [
      { categoryId: 'parole', text: 'On me dit à quel point je suis apprécié·e.' },
      { categoryId: 'temps', text: 'Une personne me consacre du temps sans distraction.' },
      { categoryId: 'attentions', text: 'Je reçois une attention ou un cadeau significatif.' },
      { categoryId: 'aide', text: 'Quelqu’un m’aide spontanément dans mes tâches.' },
      { categoryId: 'affection', text: 'Je reçois une marque d’affection physique que je souhaite (câlin, main dans la main, etc.).' },
    ],
  },
  {
    prompt: 'Lors d’une journée difficile, ce qui me réconforterait le plus est…',
    options: [
      { categoryId: 'parole', text: 'Entendre des paroles encourageantes.' },
      { categoryId: 'temps', text: 'Passer du temps avec quelqu’un qui m’écoute.' },
      { categoryId: 'attentions', text: 'Recevoir une petite attention inattendue.' },
      { categoryId: 'aide', text: 'Qu’on me donne un coup de main concret.' },
      { categoryId: 'affection', text: 'Recevoir un geste affectueux, si j’en ai envie.' },
    ],
  },
  {
    prompt: 'Dans une relation, je remarque surtout quand l’autre…',
    options: [
      { categoryId: 'parole', text: 'Me complimente sincèrement.' },
      { categoryId: 'temps', text: 'Cherche à passer du temps avec moi.' },
      { categoryId: 'attentions', text: 'M’offre quelque chose qui montre qu’il ou elle a pensé à moi.' },
      { categoryId: 'aide', text: 'Fait des choses pour m’aider.' },
      { categoryId: 'affection', text: 'Recherche une proximité physique qui me convient.' },
    ],
  },
  {
    prompt: 'Pour célébrer un événement important, je préférerais…',
    options: [
      { categoryId: 'parole', text: 'Recevoir un message sincère et touchant.' },
      { categoryId: 'temps', text: 'Vivre une activité mémorable ensemble.' },
      { categoryId: 'attentions', text: 'Recevoir un cadeau symbolique.' },
      { categoryId: 'aide', text: 'Que quelqu’un organise ou prépare quelque chose pour moi.' },
      { categoryId: 'affection', text: 'Partager des marques d’affection physique souhaitées par chacun·e.' },
    ],
  },
  {
    prompt: 'Ce qui me déçoit le plus chez un proche…',
    options: [
      { categoryId: 'parole', text: 'Les critiques fréquentes.' },
      { categoryId: 'temps', text: 'Le manque de temps passé ensemble.' },
      { categoryId: 'attentions', text: 'L’oubli d’une occasion spéciale.' },
      { categoryId: 'aide', text: 'Le manque d’aide ou de soutien pratique.' },
      { categoryId: 'affection', text: 'La distance physique ou l’absence de gestes affectueux souhaités.' },
    ],
  },
  {
    prompt: 'Je me sens particulièrement précieux·se lorsque…',
    options: [
      { categoryId: 'parole', text: 'On exprime verbalement sa reconnaissance.' },
      { categoryId: 'temps', text: 'On m’accorde toute son attention.' },
      { categoryId: 'attentions', text: 'On me remet quelque chose de significatif.' },
      { categoryId: 'aide', text: 'Quelqu’un agit pour me faciliter la vie.' },
      { categoryId: 'affection', text: 'Je ressens une proximité physique chaleureuse et bienvenue.' },
    ],
  },
  {
    prompt: 'Quand je veux montrer mon affection, je tends naturellement à…',
    options: [
      { categoryId: 'parole', text: 'Encourager et complimenter.' },
      { categoryId: 'temps', text: 'Passer du temps de qualité avec l’autre.' },
      { categoryId: 'attentions', text: 'Offrir de petites attentions.' },
      { categoryId: 'aide', text: 'Rendre service.' },
      { categoryId: 'affection', text: 'Être tactile et démonstratif·ve lorsque l’autre est à l’aise.' },
    ],
  },
  {
    prompt: 'Parmi ces situations, laquelle vous ferait le plus plaisir ?',
    options: [
      { categoryId: 'parole', text: 'Recevoir une lettre ou un message touchant.' },
      { categoryId: 'temps', text: 'Partager un souper où les conversations sont profondes.' },
      { categoryId: 'attentions', text: 'Recevoir un cadeau choisi spécialement pour vous.' },
      { categoryId: 'aide', text: 'Quelqu’un accomplit une tâche qui vous enlève un poids.' },
      { categoryId: 'affection', text: 'Recevoir un câlin chaleureux, si vous le souhaitez.' },
    ],
  },
];
const workCategories: Category[] = [
  { id: 'parole', label: 'Paroles valorisantes', short: 'exprime sa reconnaissance', color: '#315e52', intro: 'Vous appréciez recevoir de la reconnaissance verbale et des commentaires positifs.', examples: ['Dire merci.', 'Souligner vos réalisations.', 'Exprimer son appréciation.'], note: 'L’absence de rétroaction peut être perçue comme un manque de reconnaissance.', noteLabel: 'Attention' },
  { id: 'temps', label: 'Moments de qualité', short: 'consacre du temps et vous écoute réellement', color: '#cf8067', intro: 'Vous appréciez les échanges sincères et le temps accordé aux relations.', examples: ['Prendre du temps pour discuter.', 'Solliciter votre opinion.', 'Créer des moments d’échange significatifs.'], note: 'Vous pouvez être frustré·e lorsque tout va trop vite ou que les échanges deviennent uniquement transactionnels.', noteLabel: 'Attention' },
  { id: 'attentions', label: 'Attentions symboliques', short: 'fait un geste qui vous ressemble', color: '#bd9b43', intro: 'Vous appréciez les gestes qui démontrent que l’on a pensé à vous.', examples: ['Une carte de remerciement.', 'Une mention spéciale.', 'Une petite attention lors d’un accomplissement.'], note: 'La valeur du geste compte moins que l’intention derrière celui-ci.', noteLabel: 'À retenir' },
  { id: 'aide', label: 'Services rendus', short: 'offre une aide concrète', color: '#70959a', intro: 'Vous appréciez les actions concrètes et l’entraide.', examples: ['Offrir de l’aide.', 'Partager la charge de travail.', 'Respecter ses engagements.'], note: 'Vous êtes sensible au manque de collaboration.', noteLabel: 'Attention' },
  { id: 'connexion', label: 'Connexion humaine', short: 'crée une connexion humaine authentique', color: '#a57b91', intro: 'Vous valorisez les relations authentiques et un climat humain positif.', examples: ['Créer un climat accueillant.', 'Développer la confiance.', 'Favoriser les liens au sein de l’équipe.'], note: 'Les environnements impersonnels peuvent rapidement vous démobiliser.', noteLabel: 'Attention' },
];

const workQuestions: Question[] = [
  {
    prompt: 'Je me sens le plus reconnu·e lorsque :',
    options: [
      { categoryId: 'parole', text: 'On me dit à quel point ma contribution est appréciée.' },
      { categoryId: 'temps', text: 'Une personne me consacre du temps et m’écoute réellement.' },
      { categoryId: 'attentions', text: 'Je reçois une attention ou une marque de reconnaissance significative.' },
      { categoryId: 'aide', text: 'Quelqu’un m’offre de l’aide concrète lorsque j’en ai besoin.' },
      { categoryId: 'connexion', text: 'Je ressens une connexion humaine authentique avec mes collègues.' },
    ],
  },
  {
    prompt: 'Lors d’une période plus exigeante au travail, ce qui me motive le plus est :',
    options: [
      { categoryId: 'parole', text: 'Recevoir des encouragements.' },
      { categoryId: 'temps', text: 'Avoir un moment d’échange avec quelqu’un.' },
      { categoryId: 'attentions', text: 'Recevoir un geste d’appréciation.' },
      { categoryId: 'aide', text: 'Obtenir du soutien concret.' },
      { categoryId: 'connexion', text: 'Sentir que je fais partie d’une équipe soudée.' },
    ],
  },
  {
    prompt: 'Dans mon milieu de travail, j’apprécie particulièrement lorsqu’un collègue :',
    options: [
      { categoryId: 'parole', text: 'Souligne mes efforts.' },
      { categoryId: 'temps', text: 'Prend le temps de discuter avec moi.' },
      { categoryId: 'attentions', text: 'A une attention spéciale à mon égard.' },
      { categoryId: 'aide', text: 'M’offre son aide spontanément.' },
      { categoryId: 'connexion', text: 'Crée un climat chaleureux et humain.' },
    ],
  },
  {
    prompt: 'Lorsqu’un projet est terminé avec succès, je préfère :',
    options: [
      { categoryId: 'parole', text: 'Recevoir de la reconnaissance verbale.' },
      { categoryId: 'temps', text: 'Faire un retour d’équipe et partager l’expérience.' },
      { categoryId: 'attentions', text: 'Recevoir une marque de reconnaissance.' },
      { categoryId: 'aide', text: 'Voir les efforts de chacun reconnus par des actions concrètes.' },
      { categoryId: 'connexion', text: 'Célébrer ensemble dans une ambiance conviviale.' },
    ],
  },
  {
    prompt: 'Ce qui me démotive le plus est :',
    options: [
      { categoryId: 'parole', text: 'Le manque de reconnaissance.' },
      { categoryId: 'temps', text: 'Le manque de temps pour échanger.' },
      { categoryId: 'attentions', text: 'Le sentiment que mes efforts passent inaperçus.' },
      { categoryId: 'aide', text: 'Le manque de collaboration.' },
      { categoryId: 'connexion', text: 'Une ambiance froide ou distante.' },
    ],
  },
  {
    prompt: 'Je me sens particulièrement apprécié·e lorsque :',
    options: [
      { categoryId: 'parole', text: 'On exprime verbalement sa gratitude.' },
      { categoryId: 'temps', text: 'On m’accorde son attention complète.' },
      { categoryId: 'attentions', text: 'On souligne ma contribution de façon personnelle.' },
      { categoryId: 'aide', text: 'On me soutient concrètement.' },
      { categoryId: 'connexion', text: 'Je ressens un véritable esprit d’équipe.' },
    ],
  },
  {
    prompt: 'Lorsque je souhaite reconnaître un collègue, je tends naturellement à :',
    options: [
      { categoryId: 'parole', text: 'Le complimenter.' },
      { categoryId: 'temps', text: 'Lui consacrer du temps.' },
      { categoryId: 'attentions', text: 'Lui offrir une petite attention.' },
      { categoryId: 'aide', text: 'Lui donner un coup de main.' },
      { categoryId: 'connexion', text: 'Créer une connexion positive avec lui.' },
    ],
  },
  {
    prompt: 'Quelle situation vous ferait le plus plaisir ?',
    options: [
      { categoryId: 'parole', text: 'Recevoir un message de reconnaissance.' },
      { categoryId: 'temps', text: 'Avoir une discussion authentique avec un collègue.' },
      { categoryId: 'attentions', text: 'Recevoir une attention symbolique.' },
      { categoryId: 'aide', text: 'Recevoir un soutien concret dans votre travail.' },
      { categoryId: 'connexion', text: 'Participer à une activité d’équipe qui renforce les liens.' },
    ],
  },
];

const categoriesFor = (kind: SurveyKind) => kind === 'famille' ? familyCategories : workCategories;
const makeQuestions = (kind: SurveyKind): Question[] => kind === 'famille' ? familyQuestions : workQuestions;
const surveyLabel = (kind: SurveyKind) => kind === 'famille' ? 'famille' : 'entreprise';
const resultContextTitle = (kind: SurveyKind) => kind === 'famille' ? 'En famille' : 'En entreprise';

const legacyFamilyStorageKey = 'profils-appreciation-famille-v1';
const legacyWorkStorageKey = 'profils-appreciation-travail-v1';
const storageKey = (kind: SurveyKind) => `profils-appreciation-${kind}-v2`;
const hasLegacySaved = (kind: SurveyKind) => {
  try { return Boolean(localStorage.getItem(kind === 'famille' ? legacyFamilyStorageKey : legacyWorkStorageKey)); }
  catch { return false; }
};
function clearSaved(kind: SurveyKind) {
  localStorage.removeItem(storageKey(kind));
  localStorage.removeItem(kind === 'famille' ? legacyFamilyStorageKey : legacyWorkStorageKey);
}
function readSaved(kind: SurveyKind): SavedSurvey {
  try {
    const raw = localStorage.getItem(storageKey(kind));
    return raw ? JSON.parse(raw) as SavedSurvey : { answers: {} };
  } catch { return { answers: {} }; }
}
function writeSaved(kind: SurveyKind, saved: SavedSurvey) {
  try { localStorage.setItem(storageKey(kind), JSON.stringify(saved)); } catch { /* Browser storage may be disabled. */ }
}
function computeResult(kind: SurveyKind, answers: Record<number, string>, questionCount: number): Result {
  const categories = categoriesFor(kind);
  const scores: Record<string, number> = Object.fromEntries(categories.map((category) => [category.id, 0]));
  Object.values(answers).forEach((id) => { if (id in scores) scores[id] += 1; });
  const ordered = [...categories].sort((a, b) => scores[b.id] - scores[a.id] || categories.indexOf(a) - categories.indexOf(b));
  const leaders = ordered.filter((category) => scores[category.id] === scores[ordered[0].id]).map((category) => category.id);
  return {
    kind, answers, scores, primary: ordered[0].id, secondary: ordered[1].id, leaders,
    percentages: Object.fromEntries(categories.map((category) => [category.id, Math.round((scores[category.id] / questionCount) * 100)])),
    completedAt: new Date().toISOString(),
  };
}

function LocalQr({ value, size = 126, label = 'Code QR vers le questionnaire famille' }: { value: string; size?: number; label?: string }) {
  return <QRCodeSVG
    role="img"
    aria-label={label}
    value={value}
    size={size}
    level="M"
    bgColor="#ffffff"
    fgColor="#244b40"
    includeMargin
  />;
}

function Header() {
  return <header className="topbar">
    <Link className="brand" href="/" aria-label="Profils d’appréciation, accueil">
      <span className="brand-mark"><HeartHandshake size={21} /></span>
      <span className="brand-name">Profils d’appréciation<small>mieux se comprendre</small></span>
    </Link>
    <nav className="top-nav" aria-label="Navigation principale">
      <Link href="/#questionnaires">Les questionnaires</Link>
    </nav>
  </header>;
}

function Footer() {
  return <footer className="footer">
    <div className="footer-copy">
      <span>Un outil pour ouvrir la conversation, pas pour vous définir.</span>
      <span className="footer-attribution">
        Inspiration : le cadre des cinq langages présenté par Gary Chapman dans <a className="source-link" href={FRENCH_BOOK_URL} target="_blank" rel="noopener noreferrer">Les 5 langages de l’amour (livre imprimé en français)</a>.
        {' '}<a className="source-link" href={OFFICIAL_QUIZ_URL} target="_blank" rel="noopener noreferrer">Voir le quiz officiel</a>. Questionnaire indépendant, non affilié à Gary Chapman ni à ses éditeurs.
      </span>
    </div>
    <span>Vos réponses restent dans ce navigateur.</span>
  </footer>;
}

function Home({ toast }: { toast: (message: string) => void }) {
  const [showReset, setShowReset] = useState(false);
  const familySaved = readSaved('famille');
  const workSaved = readSaved('travail');
  const hasLegacyData = hasLegacySaved('famille') || hasLegacySaved('travail');
  const hasSaved = hasLegacyData || Object.keys(familySaved.answers).length > 0 || Object.keys(workSaved.answers).length > 0;
  const resetAll = () => {
    clearSaved('famille'); clearSaved('travail');
    setShowReset(false); toast('Les réponses enregistrées sur cet appareil ont été effacées.'); window.location.reload();
  };
  return <>
    <Header />
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Des façons différentes de se sentir apprécié·e</span>
          <h1>On ne se sent pas tous aimé·e de la <em>même façon.</em></h1>
          <p>Un espace simple et privé pour découvrir les gestes qui vous font du bien — sans vous enfermer dans une case.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/sondage-famille">Commencer en famille <ArrowRight size={16} /></Link><Link className="button button-light" href="/sondage-travail">Explorer en entreprise</Link></div>
        </div>
      </section>
      <div className="intro-strip"><Sparkles size={17} /><span>8 questions en famille, 8 en entreprise. Aucune bonne ou mauvaise réponse : une occasion de mieux se dire les choses.</span></div>
      <section id="questionnaires" className="section">
        <div className="section-heading"><span className="eyebrow">Deux espaces, deux contextes</span><h2>Le contexte change. Vos besoins aussi.</h2><p>Choisissez le questionnaire qui vous ressemble aujourd’hui. Ils explorent des façons différentes de recevoir de l’attention, dans le respect des limites de chacun·e.</p></div>
        <div className="survey-grid">
          <Link href="/sondage-famille" className="survey-card family" data-testid="link-family-survey"><div><span className="eyebrow">8 questions · À la maison et avec les proches</span><h3>Questionnaire famille</h3><p>Paroles valorisantes, moments de qualité, cadeaux, services rendus et affection physique souhaitée.</p></div><span className="card-arrow"><ArrowRight size={19} /></span></Link>
          <Link href="/sondage-travail" className="survey-card work" data-testid="link-work-survey"><div><span className="eyebrow">En entreprise, sans contact physique</span><h3>Questionnaire entreprise</h3><p>Paroles valorisantes, moments de qualité, attentions symboliques, services rendus et connexion humaine.</p></div><span className="card-arrow"><ArrowRight size={19} /></span></Link>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-heading"><span className="eyebrow">Quelques repères</span><h2>Une conversation, pas une étiquette.</h2></div>
        <div className="survey-grid">
          <div className="result-panel"><ShieldCheck color="#315e52" /><h2>Les limites comptent</h2><p className="small-note">Une préférence n’est jamais une obligation. Au sujet de l’affection physique, demandez toujours et respectez chaque réponse, chaque fois.</p></div>
          <div className="result-panel"><HeartHandshake color="#cf8067" /><h2>Tout peut évoluer</h2><p className="small-note">Votre résultat décrit ce qui résonne avec vous maintenant. Il peut changer selon les périodes, les relations et les contextes.</p></div>
        </div>
      </section>
    </main>
    <Footer />
    {hasSaved && <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 4 }}><button className="button button-light" onClick={() => setShowReset(true)} data-testid="button-clear-local-data"><RotateCcw size={15} /> Effacer mes réponses</button></div>}
    {showReset && <ConfirmDialog title="Effacer les réponses de cet appareil ?" description="Les réponses et résultats des deux questionnaires seront supprimés de ce navigateur. Cette action ne peut pas être annulée." onCancel={() => setShowReset(false)} onConfirm={resetAll} />}
  </>;
}

function Survey({ kind, toast }: { kind: SurveyKind; toast: (message: string) => void }) {
  const [, navigate] = useLocation();
  const questions = useMemo(() => makeQuestions(kind), [kind]);
  const [saved, setSaved] = useState<SavedSurvey>(() => readSaved(kind));
  const [index, setIndex] = useState(() => Math.min(Object.keys(readSaved(kind).answers).length, questions.length - 1));
  const [confirmClear, setConfirmClear] = useState(false);
  const hasLegacyData = hasLegacySaved(kind);
  const current = questions[index];
  const answer = saved.answers[index];
  const answeredCount = Math.min(Object.keys(saved.answers).length, questions.length);
  const choose = (option: AnswerOption) => {
    const answers = { ...saved.answers, [index]: option.categoryId };
    const next = { answers };
    setSaved(next); writeSaved(kind, next);
  };
  const goNext = () => {
    if (!answer) { toast('Choisissez la réponse qui vous ressemble le plus.'); return; }
    if (index < questions.length - 1) { setIndex(index + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else {
      const result = computeResult(kind, saved.answers, questions.length);
      const final = { answers: saved.answers, result }; setSaved(final); writeSaved(kind, final); navigate(`/resultat/${kind}`);
    }
  };
  const clear = () => { clearSaved(kind); setSaved({ answers: {} }); setIndex(0); setConfirmClear(false); toast('Questionnaire réinitialisé.'); };
  const priorUnanswered = Object.keys(saved.answers).length < index;
  return <>
    <Header />
    <main className="page-wrap fade-in">
      <Link href="/" className="page-back"><ArrowLeft size={15} /> Retour à l’accueil</Link>
      <div className="survey-head"><span className="eyebrow">Questionnaire {surveyLabel(kind)} · {questions.length} questions</span><h1>{kind === 'famille' ? 'Choisissez la réponse qui vous ressemble le plus.' : 'Choisissez ce qui vous ferait le plus de bien.'}</h1><p>Il n’y a pas de réponse juste ou attendue. Pour chaque question, choisissez une seule proposition, celle qui vous parle le plus aujourd’hui.</p></div>
      {hasLegacyData && <div className="notice" data-testid="notice-legacy-survey-data"><strong>Questionnaire mis à jour :</strong> les réponses de l’ancienne version ne sont pas reprises dans ce nouveau questionnaire. Elles restent enregistrées sur cet appareil; vous pouvez les supprimer avec le bouton « Effacer mes réponses » sur la page d’accueil.</div>}
      {kind === 'famille' && <div className="notice"><strong>À propos du contact physique :</strong> les gestes affectueux ne sont une attention que s’ils sont souhaités. Vous pouvez toujours dire non, changer d’avis, ou préférer une autre forme de proximité. Votre consentement passe avant tout résultat.</div>}
      {kind === 'travail' && <div className="notice"><strong>Un cadre professionnel :</strong> ce questionnaire explore des façons de reconnaître et soutenir le travail. Il n’inclut aucune forme de contact physique.</div>}
      <div className="progress-wrap"><span>Question {index + 1} sur {questions.length}</span><span>{answeredCount} réponse{answeredCount > 1 ? 's' : ''} enregistrée{answeredCount > 1 ? 's' : ''} sur cet appareil</span></div>
      <div className="progress-track" role="progressbar" aria-label="Progression du questionnaire" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}><div className="progress-fill" style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>
      <section className="question-card" aria-labelledby="question-title">
        <div className="question-top"><span>Choix {String(index + 1).padStart(2, '0')}</span><span>Une seule réponse</span></div>
        <h2 id="question-title">{current.prompt}</h2>
        <div className="answer-grid">
          {current.options.map((option, optionIndex) => {
            const letter = String.fromCharCode(97 + optionIndex);
            const selected = answer === option.categoryId;
            return <button type="button" key={letter} onClick={() => choose(option)} className={`answer-option ${selected ? 'selected' : ''}`} aria-pressed={selected} data-testid={`choice-${letter}-${index + 1}`}>
              <span className="choice-letter">{selected ? <Check size={16} /> : letter.toUpperCase()}</span><span>{option.text}</span>
            </button>;
          })}
        </div>
      </section>
      <div className="survey-controls"><button className="button button-light" onClick={() => index > 0 && setIndex(index - 1)} disabled={index === 0} data-testid="button-previous-question"><ChevronLeft size={16} /> Précédente</button><span className="small-note">Vos choix sont enregistrés automatiquement sur cet appareil.</span><div style={{ display: 'flex', gap: 8 }}><button className="button button-quiet" onClick={() => setConfirmClear(true)} data-testid="button-reset-survey">Recommencer</button><button className="button button-primary" onClick={goNext} disabled={!answer || priorUnanswered} data-testid="button-next-question">{index === questions.length - 1 ? 'Voir mon résultat' : 'Suivant'} <ChevronRight size={16} /></button></div></div>
      <div className="small-note" style={{ marginTop: 18 }}>Explorez ce qui vous ressemble. Ce résultat est une invitation à en parler, pas une définition de qui vous êtes.</div>
    </main>
    <Footer />
    {confirmClear && <ConfirmDialog title="Recommencer ce questionnaire ?" description={`Toutes vos réponses au questionnaire ${kind} seront effacées de ce navigateur.`} onCancel={() => setConfirmClear(false)} onConfirm={clear} />}
  </>;
}

function PrintProfileSheet({ kind, categories, result, interpretationCategories, surveyUrl }: {
  kind: SurveyKind;
  categories: Category[];
  result: Result;
  interpretationCategories: Category[];
  surveyUrl: string;
}) {
  return <section className={`print-sheet print-sheet-${kind}`} aria-label={kind === 'famille' ? 'Fiche action à imprimer' : 'Carte de profil à imprimer'}>
    <header className="print-sheet-header">
      <div className="print-brand">Profils d’appréciation <span>· mieux se comprendre</span></div>
      <span className="eyebrow">{kind === 'famille' ? 'Fiche action · Famille' : 'Carte de profil · Entreprise'}</span>
      <h1>{kind === 'famille' ? 'Pour mieux se comprendre à la maison' : 'Mon profil de reconnaissance au travail'}</h1>
      <p>{kind === 'famille'
        ? 'Des repères concrets à partager avec votre partenaire, vos enfants ou vos proches.'
        : 'Une façon simple de faire connaître ce qui vous aide à vous sentir reconnu·e dans votre travail.'}</p>
    </header>
    <div className="print-score-list" aria-label="Répartition des préférences">
      {categories.map((category) => <div className="print-score" key={category.id}>
        <span>{category.label}</span><strong>{result.percentages[category.id]} %</strong>
      </div>)}
    </div>
    <div className="print-profile-list">
      {interpretationCategories.map((category) => <article className="print-profile" key={category.id}>
        <div className="print-profile-heading">
          <h2>{category.label}</h2>
          <strong>{result.percentages[category.id]} %</strong>
        </div>
        <p>{category.intro}</p>
        <strong className="print-action-label">{kind === 'famille' ? 'Des gestes qui me font du bien' : 'Pour me reconnaître'}</strong>
        <ul>{category.examples.slice(0, kind === 'famille' ? 2 : 3).map((example) => <li key={example}>{example}</li>)}</ul>
        {category.hurts?.length ? <p className="print-note"><strong>Ce qui peut blesser :</strong> {category.hurts[0]}</p> : null}
        {category.note ? <p className="print-note"><strong>{category.noteLabel ?? 'À noter'} :</strong> {category.note}</p> : null}
      </article>)}
    </div>
    {kind === 'famille' && <aside className="print-conversation">
      <strong>Pour ouvrir la conversation</strong>
      <span>« Voici ce qui me fait du bien. Et toi, qu’est-ce qui te fait te sentir apprécié·e ? »</span>
      {interpretationCategories.some((category) => category.id === 'affection') && <small>Les gestes physiques ne conviennent que s’ils sont souhaités par toutes les personnes concernées. Le consentement et les limites passent avant toute préférence.</small>}
    </aside>}
    <aside className="print-invite">
      <div className="print-invite-copy">
        <strong>À votre tour de découvrir votre profil d’appréciation.</strong>
        <p>Scannez le code ou suivez le lien pour compléter le questionnaire {kind === 'famille' ? 'famille' : 'travail'}. Partagez cette fiche pour inviter une autre personne à découvrir son profil.</p>
        <a href={surveyUrl}>{surveyUrl}</a>
      </div>
      <div className="print-invite-code" data-survey-qr={kind}>
        <LocalQr value={surveyUrl} size={82} label={`Code QR pour compléter le questionnaire ${kind === 'famille' ? 'famille' : 'travail'}`} />
      </div>
    </aside>
    <footer className="print-sheet-footer">
      Inspiré de l’ouvrage <a className="source-link" href={FRENCH_BOOK_URL}>Les 5 langages de l’amour</a> de Gary Chapman. Questionnaire indépendant, non affilié.
    </footer>
  </section>;
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function Results({ kind, toast }: { kind: SurveyKind; toast: (message: string) => void }) {
  const [, navigate] = useLocation();
  const saved = readSaved(kind);
  const result = saved.result;
  const categories = categoriesFor(kind);
  const questionCount = makeQuestions(kind).length;
  const primary = result ? categories.find((category) => category.id === result.primary) ?? null : null;
  const secondary = result ? categories.find((category) => category.id === result.secondary) ?? null : null;
  const leaders = result ? (result.leaders?.length ? result.leaders : [result.primary])
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is Category => Boolean(category)) : [];
  const tiedAtTop = leaders.length > 1;
  const interpretationCategories = tiedAtTop ? leaders : [primary, secondary].filter((category): category is Category => Boolean(category));
  const profileCardCategories = tiedAtTop ? leaders : [primary].filter((category): category is Category => Boolean(category));
  const [confirmClear, setConfirmClear] = useState(false);
  const emailHeadline = tiedAtTop
    ? `${leaders.slice(0, 2).map((category) => category.label).join(' et ')}${leaders.length > 2 ? ' et autres' : ''} (${leaders[0] ? result?.percentages[leaders[0].id] : 0} %)`
    : primary ? `${primary.label} (${result?.percentages[primary.id]} %)` : '';
  const emailSubject = `Mon profil ${kind === 'famille' ? 'd’appréciation en famille' : 'de reconnaissance au travail'} — ${emailHeadline}`;
  const surveyUrl = surveyUrlFor(kind);
  const emailBody = result && primary && secondary ? [
    'PROFILS D’APPRÉCIATION',
    kind === 'famille' ? 'FICHE ACTION · FAMILLE' : 'CARTE DE PROFIL · ENTREPRISE',
    '',
    'Bonjour,',
    kind === 'famille'
      ? 'Je vous partage quelques repères sur ce qui m’aide à me sentir apprécié·e à la maison.'
      : 'Je vous partage quelques repères sur ce qui m’aide à me sentir reconnu·e au travail.',
    '',
    '────────────────────────────────',
    tiedAtTop
      ? `MES PRÉFÉRENCES EN TÊTE : ${leaders.map((category) => `${category.label} (${result.percentages[category.id]} %)` ).join(' · ')}`
      : `MA PRÉFÉRENCE PRINCIPALE : ${primary.label} (${result.percentages[primary.id]} %)\nMa préférence secondaire : ${secondary.label} (${result.percentages[secondary.id]} %)`,
    '',
    ...interpretationCategories.map((category) => [
      `◆ ${category.label.toUpperCase()} · ${result.percentages[category.id]} %`,
      category.intro,
      kind === 'famille' ? 'CE QUI ME FAIT DU BIEN :' : 'DES FAÇONS DE ME RECONNAÎTRE :',
      ...category.examples.slice(0, 3).map((example) => `  • ${example}`),
      category.hurts?.length ? `À ÉVITER : ${category.hurts[0]}` : '',
      category.note ? `${category.noteLabel ?? 'À noter'} : ${category.note}` : '',
    ].filter(Boolean).join('\n')),
    '',
    'LES CINQ PRÉFÉRENCES',
    categories.map((category) => `• ${category.label} : ${result.percentages[category.id]} %`).join('\n'),
    kind === 'famille' ? '\nPour en parler : « Et toi, qu’est-ce qui te fait te sentir apprécié·e ? »' : '',
    kind === 'famille' && interpretationCategories.some((category) => category.id === 'affection')
      ? 'Les gestes physiques ne conviennent que s’ils sont souhaités par toutes les personnes concernées. Le consentement et les limites passent avant toute préférence.'
      : '',
    '',
    'Ce résultat est une aide à la réflexion et à la conversation, pas un diagnostic. Les préférences peuvent évoluer.',
    '',
    'À VOTRE TOUR DE DÉCOUVRIR VOTRE PROFIL',
    `Complétez le questionnaire ${kind === 'famille' ? 'famille' : 'travail'} et découvrez ce qui vous fait vous sentir apprécié·e :`,
    surveyUrl,
    'Vous pouvez aussi partager ce lien avec une personne qui souhaite découvrir son propre profil.',
    '',
    'Source d’inspiration : le cadre des cinq langages présenté par Gary Chapman dans Les 5 langages de l’amour.',
    `Livre imprimé en français : ${FRENCH_BOOK_URL}`,
    'Questionnaire indépendant, distinct du quiz officiel et non affilié à Gary Chapman ni à ses éditeurs :',
    OFFICIAL_QUIZ_URL,
  ].filter(Boolean).join('\n') : '';
  const emailProfilesHtml = interpretationCategories.map((category) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border:1px solid #dce2da;border-radius:10px;background:#ffffff;">
      <tr><td style="padding:14px 16px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:Arial,sans-serif;font-size:17px;font-weight:bold;color:#253b32;">${escapeHtml(category.label)}</td>
          <td align="right" style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#315e52;">${result?.percentages[category.id] ?? 0} %</td>
        </tr></table>
        <p style="margin:8px 0;color:#536157;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">${escapeHtml(category.intro)}</p>
        <p style="margin:8px 0 4px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#315e52;">${kind === 'famille' ? 'CE QUI ME FAIT DU BIEN' : 'DES FAÇONS DE ME RECONNAÎTRE'}</p>
        <ul style="margin:4px 0 10px;padding-left:20px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#536157;">
          ${category.examples.slice(0, 3).map((example) => `<li style="padding:2px 0;">${escapeHtml(example)}</li>`).join('')}
        </ul>
        ${category.hurts?.length ? `<p style="margin:6px 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.45;color:#536157;"><strong>À éviter :</strong> ${escapeHtml(category.hurts[0])}</p>` : ''}
        ${category.note ? `<p style="margin:6px 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.45;color:#536157;"><strong>${escapeHtml(category.noteLabel ?? 'À noter')} :</strong> ${escapeHtml(category.note)}</p>` : ''}
      </td></tr>
    </table>`).join('');
  const emailScoresHtml = categories.map((category) => `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e9e2;font-family:Arial,sans-serif;font-size:12px;color:#536157;">${escapeHtml(category.label)}</td>
      <td align="right" style="padding:7px 10px;border-bottom:1px solid #e5e9e2;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;color:#315e52;">${result?.percentages[category.id] ?? 0} %</td>
    </tr>`).join('');
  const emailHtml = result && primary && secondary ? `
    <html><body style="margin:0;padding:0;background:#ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;table-layout:fixed;border-collapse:collapse;font-family:Arial,sans-serif;color:#253b32;">
          <tr><td style="padding:22px 24px;border-radius:14px 14px 0 0;background:#315e52;color:#ffffff;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:1.5px;">PROFILS D’APPRÉCIATION</p>
            <h1 style="margin:0;font-size:25px;line-height:1.2;">${kind === 'famille' ? 'Ma fiche action · famille' : 'Mon profil de reconnaissance au travail'}</h1>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#edf2eb;">${kind === 'famille' ? 'Des repères concrets pour mieux se comprendre à la maison.' : 'Ce qui m’aide à me sentir reconnu·e dans mon travail.'}</p>
          </td></tr>
          <tr><td style="padding:14px 4px 12px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#536157;">
            <p style="margin:0 0 6px;">Bonjour,</p>
            <p style="margin:0;">${kind === 'famille' ? 'Je vous partage quelques repères sur ce qui m’aide à me sentir apprécié·e à la maison.' : 'Je vous partage quelques repères sur ce qui m’aide à me sentir reconnu·e au travail.'}</p>
          </td></tr>
          <tr><td style="padding:18px 20px;background:#f3f0e6;">
            <p style="margin:0 0 5px;font-size:11px;font-weight:bold;letter-spacing:1px;color:#68786d;">${tiedAtTop ? 'PRÉFÉRENCES À ÉGALITÉ' : 'PRÉFÉRENCE PRINCIPALE'}</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;line-height:1.25;color:#253b32;">${escapeHtml(tiedAtTop ? leaders.map((category) => category.label).join(' · ') : primary.label)}</p>
            <p style="margin:5px 0 0;font-size:13px;color:#536157;">${tiedAtTop ? `${result.percentages[leaders[0]?.id ?? primary.id]} % chacune` : `${result.percentages[primary.id]} % · préférence secondaire : ${escapeHtml(secondary.label)} (${result.percentages[secondary.id]} %)`}</p>
          </td></tr>
          <tr><td style="padding:16px 0 4px;">
            <h2 style="margin:0 0 10px;font-size:15px;color:#315e52;">${kind === 'famille' ? 'Des gestes qui me font du bien' : 'Quelques façons de me reconnaître'}</h2>
            ${emailProfilesHtml}
          </td></tr>
          <tr><td style="padding:13px 16px;border-radius:10px;background:#ffffff;">
            <h2 style="margin:0 0 6px;font-size:14px;color:#315e52;">Mes cinq préférences</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${emailScoresHtml}</table>
          </td></tr>
          ${kind === 'famille' ? `<tr><td style="padding:14px 4px 4px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#536157;"><strong>Pour ouvrir la conversation :</strong> « Voici ce qui me fait du bien. Et toi, qu’est-ce qui te fait te sentir apprécié·e ? »${interpretationCategories.some((category) => category.id === 'affection') ? '<br><br>Les gestes physiques ne conviennent que s’ils sont souhaités. Le consentement et les limites passent avant toute préférence.' : ''}</td></tr>` : ''}
          <tr><td style="padding:14px 10px;border-radius:10px;background:#f3f0e6;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:10px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#253b32;">
                <strong style="font-size:15px;color:#315e52;">À votre tour de découvrir votre profil !</strong>
                <p style="margin:6px 0;">Complétez le questionnaire ${kind === 'famille' ? 'famille' : 'travail'} en scannant le code ou en suivant le lien.</p>
                <a href="${escapeHtml(surveyUrl)}" style="color:#315e52;font-weight:bold;">Compléter le questionnaire</a>
                <p style="margin:7px 0 0;font-size:12px;">Vous pouvez aussi transférer cette invitation ou partager le lien avec une personne qui souhaite découvrir son profil.</p>
                <a href="${escapeHtml(surveyUrl)}" style="color:#536157;font-size:11px;overflow-wrap:anywhere;">${escapeHtml(surveyUrl)}</a>
              </td>
              <td width="100" align="right" valign="middle" style="width:100px;padding-left:6px;">
                <a href="${escapeHtml(surveyUrl)}" style="text-decoration:none;"><!--SURVEY_QR--></a>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:14px 4px;font-family:Arial,sans-serif;font-size:11px;line-height:1.45;color:#69766d;">Un point de départ pour discuter, pas une étiquette ni un diagnostic. Les préférences peuvent évoluer.<br><br><strong>Source d’inspiration :</strong> le cadre des cinq langages présenté par Gary Chapman dans <a href="${FRENCH_BOOK_URL}" style="color:#315e52;">Les 5 langages de l’amour</a>. Questionnaire indépendant, distinct du <a href="${OFFICIAL_QUIZ_URL}" style="color:#315e52;">quiz officiel</a>, non affilié à l’auteur ni à ses éditeurs.</td></tr>
        </table>
      </td></tr></table>
    </body></html>` : '';
  const copyFormattedEmail = async () => {
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        try {
          const qrSvg = document.querySelector(`[data-survey-qr="${kind}"] svg`)?.outerHTML ?? '';
          const formattedHtml = emailHtml.replace('<!--SURVEY_QR-->', qrSvg);
          await navigator.clipboard.write([new ClipboardItem({
            'text/html': new Blob([formattedHtml], { type: 'text/html' }),
            'text/plain': new Blob([emailBody], { type: 'text/plain' }),
          })]);
          toast('Fiche mise en forme copiée. Collez-la dans le courriel.');
          return;
        } catch {
          // Some browsers allow plain-text clipboard access but block HTML clipboard data.
        }
      }
      await navigator.clipboard.writeText(emailBody);
      toast('Version texte copiée. Collez-la dans le courriel.');
    } catch { toast('Copie indisponible dans ce navigateur.'); }
  };
  const prepareEmail = () => { window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`; };
  const reset = () => { clearSaved(kind); setConfirmClear(false); navigate(`/sondage-${kind}`); };
  if (!result || !primary || !secondary) return <>
    <Header /><main className="page-wrap"><div className="empty-state"><span className="brand-mark" style={{ margin: 'auto' }}><HeartHandshake size={21} /></span><h1>Votre reflet est en attente.</h1><p>Répondez aux {questionCount} questions du questionnaire {surveyLabel(kind)} pour découvrir votre résultat. Vos réponses sont conservées uniquement sur cet appareil.</p><Link className="button button-primary" href={`/sondage-${kind}`}>Continuer le questionnaire <ArrowRight size={16} /></Link><div style={{ marginTop: 12 }}><button className="button button-quiet" onClick={() => { clearSaved(kind); toast('Réponses effacées.'); }} data-testid="button-clear-empty">Effacer les réponses enregistrées</button></div></div></main><Footer />
  </>;
  return <>
    <Header />
    <main className="page-wrap fade-in">
      <PrintProfileSheet kind={kind} categories={categories} result={result} interpretationCategories={interpretationCategories} surveyUrl={surveyUrl} />
      <div className="screen-result">
        <Link href="/" className="page-back"><ArrowLeft size={15} /> Retour à l’accueil</Link>
        <section className="result-hero">
          <span className="eyebrow">Votre reflet · {resultContextTitle(kind)}</span>
          <h1>{tiedAtTop ? 'Plusieurs façons comptent pour vous.' : <>Vous vous sentez apprécié·e quand on vous <em style={{ color: '#cf8067', fontStyle: 'italic' }}>{primary.short.toLowerCase()}.</em></>}</h1>
          <p>{tiedAtTop
            ? <>Vos réponses font ressortir à égalité <strong>{leaders.map((category) => category.label.toLowerCase()).join(', ')}</strong>. Voici ce que ces préférences peuvent signifier et quelques exemples.</>
            : <>Votre préférence qui ressort le plus aujourd’hui est <strong>{primary.label.toLowerCase()}</strong>. Une autre façon de vous rejoindre compte aussi : <strong>{secondary.label.toLowerCase()}</strong>.</>}</p>
        </section>
        {kind === 'famille' ? <section className="profile-card family-action-card" id="family-action-sheet" data-testid="family-action-sheet">
          <div className="profile-card-overline"><span className="eyebrow">Fiche action · famille</span><span>À partager avec vos proches</span></div>
          <h2>Pour mieux se comprendre à la maison</h2>
          <p className="profile-card-intro">Voici des gestes concrets qui peuvent m’aider à me sentir apprécié·e. Vous pouvez en parler avec votre partenaire, vos enfants ou une personne proche.</p>
          <div className="profile-card-actions-list">
            {interpretationCategories.map((category) => <article className="profile-action-item" key={category.id}>
              <h3>{category.label} <span>{result.percentages[category.id]} %</span></h3>
              <ul>{category.examples.slice(0, 2).map((example) => <li key={example}>{example}</li>)}</ul>
            </article>)}
          </div>
          <div className="conversation-prompt"><strong>Pour commencer la conversation</strong><p>« Voici ce qui me fait du bien. Et toi, qu’est-ce qui te fait te sentir apprécié·e ? »</p></div>
          {interpretationCategories.some((category) => category.id === 'affection') && <p className="profile-card-consent">Les gestes physiques ne conviennent que s’ils sont souhaités. Demandez, écoutez et respectez les limites de chacun·e.</p>}
          <div className="profile-card-buttons">
            <button className="button button-primary" onClick={prepareEmail} data-testid="button-email-result"><Mail size={16} /> Préparer un courriel</button>
            <button className="button button-light" onClick={copyFormattedEmail} data-testid="button-copy-formatted-email"><Copy size={16} /> Copier la fiche mise en forme</button>
          </div>
          <p className="small-note" style={{ marginTop: 10 }}>« Préparer un courriel » ouvre un brouillon avec l’objet. La copie mise en forme concerne le corps du message : placez le curseur à l’endroit voulu dans Outlook avant de coller, notamment au-dessus de votre signature.</p>
        </section> : <section className="profile-card work-profile-card" data-testid="work-profile-card">
          <div className="profile-card-overline"><span className="eyebrow">Carte de profil · entreprise</span><span>À partager au travail</span></div>
          <h2>{profileCardCategories.map((category) => category.label).join(' · ')}</h2>
          <p className="profile-card-intro">{profileCardCategories.map((category) => category.intro).join(' ')}</p>
          <div className="profile-card-actions-list">
            {profileCardCategories.map((category) => <article className="profile-action-item" key={category.id}>
              <h3>Pour reconnaître {category.label.toLowerCase()} <span>{result.percentages[category.id]} %</span></h3>
              <ul>{category.examples.slice(0, 3).map((example) => <li key={example}>{example}</li>)}</ul>
              {category.note && <p className="profile-card-consent"><strong>{category.noteLabel ?? 'À noter'} :</strong> {category.note}</p>}
            </article>)}
          </div>
          {!tiedAtTop && <p className="profile-card-secondary"><strong>Une préférence secondaire :</strong> {secondary.label} ({result.percentages[secondary.id]} %)</p>}
          <div className="profile-card-buttons">
            <button className="button button-primary" onClick={prepareEmail} data-testid="button-email-result"><Mail size={16} /> Préparer un courriel</button>
            <button className="button button-light" onClick={copyFormattedEmail} data-testid="button-copy-formatted-email"><Copy size={16} /> Copier la fiche mise en forme</button>
          </div>
          <p className="small-note" style={{ marginTop: 10 }}>« Préparer un courriel » ouvre un brouillon avec l’objet. La copie mise en forme concerne le corps du message : placez le curseur à l’endroit voulu dans Outlook avant de coller, notamment au-dessus de votre signature.</p>
        </section>}
        <div className="result-content">
          <section className="result-panel"><span className="eyebrow">Vos cinq préférences</span><h2>Un aperçu, sans classement.</h2><p className="small-note">Les pourcentages représentent la part de choix associés à chaque façon de recevoir de l’attention. Ils ne mesurent pas votre valeur.</p>
            {categories.map((category) => <div className="score-row" key={category.id} data-testid={`score-${category.id}`}><div className="score-label"><strong>{category.label}</strong><span>{result.percentages[category.id]} %</span></div><div className="scorebar"><span style={{ width: `${result.percentages[category.id]}%`, background: category.color }} /></div></div>)}
          </section>
          <section className="result-panel"><span className="eyebrow">Selon vos réponses</span><h2>Interprétation et exemples</h2>
            {interpretationCategories.map((category, i) => <div className="insight" key={category.id}><span className="eyebrow">{tiedAtTop ? 'À égalité en tête' : i === 0 ? 'Votre préférence la plus marquée' : 'Une préférence secondaire'}</span><h3>{category.label}</h3><p>{category.intro}</p><ul>{category.examples.map((example) => <li key={example}>{example}</li>)}</ul>{category.hurts && <><h4>Ce qui peut blesser</h4><ul>{category.hurts.map((item) => <li key={item}>{item}</li>)}</ul></>}{category.note && <><h4>{category.noteLabel ?? 'À noter'}</h4><p>{category.note}</p></>}</div>)}
          </section>
        </div>
        {kind === 'famille' && <div className="notice"><strong>Rappel de consentement :</strong> l’affection physique ne convient que si elle est souhaitée par toutes les personnes concernées. Demandez, écoutez et respectez les limites, sans exception.</div>}
        <div className="notice"><strong>À garder en tête.</strong> Ce questionnaire indépendant de huit questions s’inspire du cadre des cinq langages présenté par Gary Chapman dans <a className="source-link" href={FRENCH_BOOK_URL} target="_blank" rel="noopener noreferrer">Les 5 langages de l’amour</a>. Il est adapté aux contextes familial et professionnel; ce n’est pas le <a className="source-link" href={OFFICIAL_QUIZ_URL} target="_blank" rel="noopener noreferrer">quiz officiel</a> et il n’est affilié ni à l’auteur ni à ses éditeurs. C’est une aide à la réflexion, pas un test clinique ni un outil psychométrique validé; vos préférences peuvent évoluer et ne résument pas votre personnalité.</div>
        <div className="result-actions"><button className="button button-primary" onClick={() => window.print()} data-testid="button-print-result"><Printer size={16} /> Fiche PDF · 1 page</button><Link className="button button-light" href={`/sondage-${kind}`}><RotateCcw size={16} /> Refaire le questionnaire</Link><button className="button button-quiet" onClick={() => setConfirmClear(true)} data-testid="button-delete-result">Effacer mon résultat</button></div>
        <p className="small-note" style={{ marginTop: 15 }}>L’application prépare un brouillon; elle n’envoie aucun courriel à votre place.</p>
      </div>
    </main>
    <Footer />
    {confirmClear && <ConfirmDialog title="Effacer ce résultat ?" description="Les réponses et le résultat de ce questionnaire seront supprimés de ce navigateur." onCancel={() => setConfirmClear(false)} onConfirm={reset} />}
  </>;
}

function ConfirmDialog({ title, description, onCancel, onConfirm }: { title: string; description: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">{title}</h2><p>{description}</p><div className="modal-actions"><button className="button button-light" onClick={onCancel} data-testid="button-cancel-clear">Garder</button><button className="button button-primary" onClick={onConfirm} data-testid="button-confirm-clear">Effacer</button></div></div></div>;
}

function NotFound() { return <><Header /><main className="empty-state"><h1>Cette page n’existe pas.</h1><p>Retournons à l’espace de découverte.</p><Link href="/" className="button button-primary">Accueil <ArrowRight size={16} /></Link></main><Footer /></>; }

function App() {
  const [toastText, setToastText] = useState('');
  useEffect(() => { if (!toastText) return; const timeout = window.setTimeout(() => setToastText(''), 2600); return () => window.clearTimeout(timeout); }, [toastText]);
  const toast = (message: string) => setToastText(message);
  return <div className="site-shell"><Switch>
    <Route path="/" component={() => <Home toast={toast} />} />
    <Route path="/sondage-famille" component={() => <Survey kind="famille" toast={toast} />} />
    <Route path="/sondage-travail" component={() => <Survey kind="travail" toast={toast} />} />
    <Route path="/resultat/famille" component={() => <Results kind="famille" toast={toast} />} />
    <Route path="/resultat/travail" component={() => <Results kind="travail" toast={toast} />} />
    <Route component={NotFound} />
  </Switch>{toastText && <div className="toast-message" role="status" data-testid="status-toast">{toastText}</div>}</div>;
}

export default App;
