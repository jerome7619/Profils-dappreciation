import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight,
  HeartHandshake, Link2, Mail, Printer, RotateCcw, ShieldCheck, Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type SurveyKind = 'famille' | 'travail';
type Category = { id: string; label: string; short: string; color: string; intro: string; examples: string[] };
type Question = { prompt: string; a: { text: string; categoryId: string }; b: { text: string; categoryId: string } };
type Result = { kind: SurveyKind; answers: Record<number, string>; scores: Record<string, number>; primary: string; secondary: string; percentages: Record<string, number>; completedAt: string };
type SavedSurvey = { answers: Record<number, string>; result?: Result };

const familyCategories: Category[] = [
  { id: 'parole', label: 'Parole d’appréciation', short: 'Les mots qui comptent', color: '#315e52', intro: 'Des mots sincères et précis vous aident à sentir que vos efforts, votre présence ou vos qualités sont remarqués.', examples: ['Nommer précisément ce qui a été apprécié.', 'Dire merci sans attendre une occasion spéciale.', 'Exprimer avec des mots ce que votre présence apporte.'] },
  { id: 'temps', label: 'Temps pleinement partagé', short: 'Une présence attentive', color: '#cf8067', intro: 'La disponibilité et l’attention sans distraction peuvent être une façon particulièrement forte de vous montrer que vous comptez.', examples: ['Partager une activité en laissant les écrans de côté.', 'Prendre le temps d’écouter sans se presser.', 'Créer un petit rituel à deux ou en famille.'] },
  { id: 'attentions', label: 'Attentions symboliques', short: 'Un signe qui vous ressemble', color: '#bd9b43', intro: 'Un petit objet ou un geste choisi avec soin peut vous rappeler qu’une personne a pensé à vous.', examples: ['Offrir un dessin, une fleur ou une carte faite à la main.', 'Choisir un petit objet lié à un souvenir partagé.', 'Glisser un mot doux dans un endroit inattendu.'] },
  { id: 'aide', label: 'Aide concrète', short: 'Un geste qui allège', color: '#70959a', intro: 'Les gestes pratiques et le soutien visible peuvent vous faire sentir accompagné·e, surtout quand les journées sont chargées.', examples: ['Prendre en charge une tâche sans qu’on ait à la demander.', 'Proposer son aide pour un projet qui semble lourd.', 'Préparer quelque chose qui rend la journée plus facile.'] },
  { id: 'affection', label: 'Affection physique souhaitée', short: 'Une proximité consentie', color: '#a57b91', intro: 'Un contact affectueux, lorsqu’il est souhaité et bienvenu, peut vous donner un sentiment de proximité et de réconfort.', examples: ['Proposer un câlin en respectant la réponse.', 'S’asseoir près de vous si cette proximité vous convient.', 'Tenir la main ou faire un geste tendre avec votre accord.'] },
];
const workCategories: Category[] = [
  { id: 'reconnaissance', label: 'Reconnaissance verbale précise', short: 'Un retour qui nomme', color: '#315e52', intro: 'Un retour sincère, concret et lié à votre contribution vous aide à voir que votre travail a été remarqué.', examples: ['Nommer un résultat ou une compétence de façon précise.', 'Recevoir un merci directement lié à votre contribution.', 'Entendre clairement en quoi votre travail a aidé le collectif.'] },
  { id: 'ecoute', label: 'Écoute et temps d’échange', short: 'Une attention réelle', color: '#cf8067', intro: 'Avoir un espace d’échange où l’on vous écoute vraiment peut vous aider à vous sentir considéré·e et compris·e.', examples: ['Prévoir un moment sans interruptions pour faire le point.', 'Être écouté·e avant qu’une solution soit proposée.', 'Avoir une conversation utile sur vos idées et vos priorités.'] },
  { id: 'attentions', label: 'Attentions symboliques', short: 'Un signe de considération', color: '#bd9b43', intro: 'Un signe simple et bien choisi peut rendre visible l’attention portée à votre contribution.', examples: ['Recevoir un mot de remerciement écrit et personnel.', 'Marquer une étape avec une petite attention collective.', 'Recevoir un souvenir symbolique lié à un projet accompli.'] },
  { id: 'soutien', label: 'Soutien concret et collaboration', short: 'Avancer ensemble', color: '#70959a', intro: 'Une aide pratique, une ressource ou un coup de main au bon moment peut vous montrer que vous n’avez pas à tout porter seul·e.', examples: ['Obtenir un coup de main pour débloquer une tâche.', 'Partager la charge quand les priorités s’accumulent.', 'Recevoir les moyens ou informations nécessaires pour avancer.'] },
  { id: 'confiance', label: 'Confiance et autonomie', short: 'La latitude d’agir', color: '#a57b91', intro: 'La confiance, la marge de manœuvre et la responsabilité peuvent être des marques fortes de reconnaissance pour vous.', examples: ['Avoir le choix de la méthode pour atteindre un objectif.', 'Se voir confier une responsabilité avec une vraie latitude.', 'Pouvoir organiser son temps dans un cadre clair.'] },
];

const situations = [
  'Après une journée qui vous a demandé beaucoup d’énergie,',
  'Quand vous venez de terminer quelque chose qui vous tenait à cœur,',
  'À un moment où vous doutez un peu de vous,',
  'Quand vous avez fait un effort que peu de personnes ont remarqué,',
  'Pour rendre une journée ordinaire plus agréable,',
  'Après une petite réussite dont vous êtes content·e,',
  'Quand vous traversez une période particulièrement chargée,',
  'Pour vous montrer que quelqu’un a pensé à vous,',
  'Quand vous avez besoin de vous sentir soutenu·e,',
  'Après avoir consacré du temps à quelque chose d’important,',
  'Pour célébrer une étape, même modeste,',
  'Quand vous avez besoin de retrouver confiance,',
  'Pour vous aider à vous sentir proche des autres,',
  'Quand vous avez accompli quelque chose avec persévérance,',
  'Pour vous faire sentir à votre place dans un groupe,',
  'Quand il y a beaucoup à faire et peu de temps,',
  'Après une conversation ou un moment marquant,',
  'Pour vous encourager à poursuivre un projet,',
  'Quand vous vous sentez un peu à l’écart,',
  'Pour marquer un moment qui compte pour vous,',
  'Quand une journée ne s’est pas passée comme prévu,',
  'Pour vous aider à démarrer quelque chose de nouveau,',
  'Quand vous avez apporté votre aide à quelqu’un,',
  'Pour vous remercier d’un effort récent,',
  'Quand vous pensez à ce qui vous fait vous sentir apprécié·e,',
];

const optionIdeas: Record<string, string[]> = {
  parole: ['entendre des mots sincères qui disent précisément ce que vous avez bien fait.', 'recevoir un merci qui nomme l’effort que vous avez fourni.', 'qu’on vous dise avec des mots pourquoi votre présence est importante.', 'entendre un encouragement honnête qui vous aide à continuer.', 'qu’une personne vous fasse un compliment vrai et bien précis.'],
  temps: ['partager un moment où l’autre est pleinement disponible pour vous.', 'prendre le temps de parler sans être interrompu·e.', 'faire ensemble une activité simple, en étant vraiment présent·e.', 'avoir une conversation où l’on vous écoute jusqu’au bout.', 'passer un moment calme à deux, sans se presser.'],
  attentions: ['recevoir un petit signe choisi spécialement pour vous.', 'trouver un mot, un dessin ou un objet qui rappelle un souvenir partagé.', 'recevoir une petite surprise qui montre qu’on a pensé à vous.', 'garder un souvenir symbolique d’un moment vécu ensemble.', 'découvrir une attention simple, préparée avec soin.'],
  aide: ['voir quelqu’un prendre en charge une tâche qui vous pèse.', 'recevoir un coup de main pratique sans devoir tout organiser.', 'qu’une personne vous aide à faire avancer ce qui est urgent.', 'trouver une tâche déjà faite pour vous simplifier la journée.', 'pouvoir compter sur un soutien concret au bon moment.'],
  affection: ['qu’on vous propose un câlin, en respectant votre réponse.', 'recevoir un geste tendre si vous en avez envie à ce moment-là.', 'être assis·e près d’une personne de confiance si cela vous convient.', 'pouvoir partager une proximité affectueuse que vous souhaitez.', 'recevoir un contact réconfortant, seulement s’il est bienvenu pour vous.'],
  reconnaissance: ['recevoir un retour qui nomme précisément votre contribution.', 'entendre un merci concret qui fait référence à votre travail.', 'savoir clairement ce que votre effort a apporté au résultat.', 'recevoir un compliment professionnel sincère et précis.', 'qu’une personne souligne une compétence que vous avez mobilisée.'],
  ecoute: ['avoir un moment d’échange où la personne est pleinement à l’écoute.', 'pouvoir parler de vos idées sans être pressé·e ni interrompu·e.', 'être écouté·e avec attention avant qu’on cherche des solutions.', 'prendre le temps de faire le point dans une conversation utile.', 'avoir un espace calme pour partager ce qui compte pour vous.'],
  soutien: ['recevoir un coup de main qui débloque concrètement votre travail.', 'partager la charge avec une personne qui propose son aide.', 'obtenir les ressources nécessaires pour avancer sans obstacle.', 'travailler en collaboration pour mener à bien une tâche difficile.', 'savoir qu’une personne peut prendre le relais si nécessaire.'],
  confiance: ['avoir la latitude de choisir comment vous allez procéder.', 'recevoir une responsabilité avec une vraie marge de décision.', 'pouvoir organiser votre travail à votre manière, dans un cadre clair.', 'sentir qu’on vous fait confiance pour prendre les bonnes décisions.', 'disposer de l’autonomie nécessaire pour mener votre idée à terme.'],
};

const categoriesFor = (kind: SurveyKind) => kind === 'famille' ? familyCategories : workCategories;
const makeQuestions = (kind: SurveyKind): Question[] => {
  const categories = categoriesFor(kind);
  return situations.map((prompt, index) => {
    const first = categories[index % 5];
    const second = categories[(index + 1) % 5];
    return {
      prompt,
      a: { categoryId: first.id, text: optionIdeas[first.id][Math.floor(index / 5)] },
      b: { categoryId: second.id, text: optionIdeas[second.id][Math.floor(index / 5)] },
    };
  });
};

const storageKey = (kind: SurveyKind) => `profils-appreciation-${kind}-v1`;
function readSaved(kind: SurveyKind): SavedSurvey {
  try {
    const raw = localStorage.getItem(storageKey(kind));
    return raw ? JSON.parse(raw) as SavedSurvey : { answers: {} };
  } catch { return { answers: {} }; }
}
function writeSaved(kind: SurveyKind, saved: SavedSurvey) {
  try { localStorage.setItem(storageKey(kind), JSON.stringify(saved)); } catch { /* Browser storage may be disabled. */ }
}
function computeResult(kind: SurveyKind, answers: Record<number, string>): Result {
  const categories = categoriesFor(kind);
  const scores: Record<string, number> = Object.fromEntries(categories.map((category) => [category.id, 0]));
  Object.values(answers).forEach((id) => { if (id in scores) scores[id] += 1; });
  const ordered = [...categories].sort((a, b) => scores[b.id] - scores[a.id] || categories.indexOf(a) - categories.indexOf(b));
  return {
    kind, answers, scores, primary: ordered[0].id, secondary: ordered[1].id,
    percentages: Object.fromEntries(categories.map((category) => [category.id, Math.round((scores[category.id] / 25) * 100)])),
    completedAt: new Date().toISOString(),
  };
}

function LocalQr({ value, size = 126 }: { value: string; size?: number }) {
  return <QRCodeSVG
    role="img"
    aria-label="Code QR vers le questionnaire famille"
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
      <Link href="/#partager">Partager</Link>
    </nav>
  </header>;
}

function Footer() {
  return <footer className="footer"><span>Un outil pour ouvrir la conversation, pas pour vous définir.</span><span>Vos réponses restent dans ce navigateur.</span></footer>;
}

function Home({ toast }: { toast: (message: string) => void }) {
  const [showReset, setShowReset] = useState(false);
  const familyUrl = `${window.location.origin}/sondage-famille`;
  const familySaved = readSaved('famille');
  const workSaved = readSaved('travail');
  const hasSaved = Object.keys(familySaved.answers).length > 0 || Object.keys(workSaved.answers).length > 0;
  const copyFamilyLink = async () => {
    try { await navigator.clipboard.writeText(familyUrl); toast('Lien du questionnaire famille copié.'); }
    catch { toast('Copie indisponible dans ce navigateur.'); }
  };
  const downloadQr = () => {
    const svg = document.querySelector('.qr-frame svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'questionnaire-famille-qr.svg'; link.click(); URL.revokeObjectURL(link.href);
    toast('Code QR téléchargé.');
  };
  const resetAll = () => {
    localStorage.removeItem(storageKey('famille')); localStorage.removeItem(storageKey('travail'));
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
          <div className="hero-actions"><Link className="button button-primary" href="/sondage-famille">Commencer en famille <ArrowRight size={16} /></Link><Link className="button button-light" href="/sondage-travail">Explorer au travail</Link></div>
        </div>
        <div className="hero-art" aria-label="Illustration abstraite de liens et de proximité">
          <div className="orbit" /><div className="orbit orbit-two" /><span className="art-note">à sa manière</span><span className="hero-leaf">⌁</span><span className="art-stamp">être vu·e<br />à sa façon</span>
        </div>
      </section>
      <div className="intro-strip"><Sparkles size={17} /><span>25 petits choix. Aucune bonne ou mauvaise réponse. Juste une occasion de mieux se dire les choses.</span></div>
      <section id="questionnaires" className="section">
        <div className="section-heading"><span className="eyebrow">Deux espaces, deux contextes</span><h2>Le contexte change. Vos besoins aussi.</h2><p>Choisissez le questionnaire qui vous ressemble aujourd’hui. Ils explorent des façons différentes de recevoir de l’attention, dans le respect des limites de chacun·e.</p></div>
        <div className="survey-grid">
          <Link href="/sondage-famille" className="survey-card family" data-testid="link-family-survey"><div><span className="eyebrow">À la maison et avec les proches</span><h3>Questionnaire famille</h3><p>Des mots, du temps, de petites attentions, de l’aide et une affection physique toujours souhaitée.</p></div><span className="card-arrow"><ArrowRight size={19} /></span></Link>
          <Link href="/sondage-travail" className="survey-card work" data-testid="link-work-survey"><div><span className="eyebrow">Au travail, sans contact physique</span><h3>Questionnaire travail</h3><p>Une reconnaissance précise, de l’écoute, des attentions, du soutien et la confiance d’agir.</p></div><span className="card-arrow"><ArrowRight size={19} /></span></Link>
        </div>
      </section>
      <section id="partager" className="section" style={{ paddingTop: 5 }}>
        <div className="privacy-band">
          <div><span className="eyebrow">Privé par conception</span><h2>Vos réponses restent ici.</h2><p>Aucun compte, aucun nom, aucune donnée envoyée ailleurs. Les réponses et résultats sont enregistrés uniquement dans le stockage local de ce navigateur. Vous pouvez tout effacer à tout moment.</p></div>
          <div className="qr-card"><div className="qr-frame"><LocalQr value={familyUrl} /></div><div><span className="eyebrow">À partager en famille</span><p>Ce code ouvre le questionnaire famille uniquement. Il ne contient aucune réponse personnelle.</p><button className="button button-light" onClick={copyFamilyLink} data-testid="button-copy-family-link"><Link2 size={15} /> Copier le lien</button><button className="button button-quiet" onClick={downloadQr} data-testid="button-download-qr"><ArrowDownToLine size={15} /> Télécharger le QR</button><button className="button button-quiet" onClick={() => window.print()} data-testid="button-print-qr"><Printer size={15} /> Imprimer</button></div></div>
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
  const [index, setIndex] = useState(() => Math.min(Object.keys(readSaved(kind).answers).length, 24));
  const [confirmClear, setConfirmClear] = useState(false);
  const current = questions[index];
  const answer = saved.answers[index];
  const chosenOption = answer === current.a.categoryId ? 'a' : answer === current.b.categoryId ? 'b' : '';
  const answeredCount = Object.keys(saved.answers).length;
  const choose = (option: Question['a']) => {
    const answers = { ...saved.answers, [index]: option.categoryId };
    const next = { answers };
    setSaved(next); writeSaved(kind, next);
  };
  const goNext = () => {
    if (!answer) { toast('Choisissez la réponse qui vous ressemble le plus.'); return; }
    if (index < 24) { setIndex(index + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else {
      const result = computeResult(kind, saved.answers);
      const final = { answers: saved.answers, result }; setSaved(final); writeSaved(kind, final); navigate(`/resultat/${kind}`);
    }
  };
  const clear = () => { localStorage.removeItem(storageKey(kind)); setSaved({ answers: {} }); setIndex(0); setConfirmClear(false); toast('Questionnaire réinitialisé.'); };
  const priorUnanswered = Object.keys(saved.answers).length < index;
  return <>
    <Header />
    <main className="page-wrap fade-in">
      <Link href="/" className="page-back"><ArrowLeft size={15} /> Retour à l’accueil</Link>
      <div className="survey-head"><span className="eyebrow">{kind === 'famille' ? 'Questionnaire famille' : 'Questionnaire travail'} · 25 choix</span><h1>Choisissez ce qui vous ferait le plus de bien.</h1><p>Il n’y a pas de réponse juste ou attendue. Pour chaque situation, choisissez une seule proposition, celle qui vous parle le plus aujourd’hui.</p></div>
      {kind === 'famille' && <div className="notice"><strong>À propos du contact physique :</strong> les gestes affectueux ne sont une attention que s’ils sont souhaités. Vous pouvez toujours dire non, changer d’avis, ou préférer une autre forme de proximité. Votre consentement passe avant tout résultat.</div>}
      {kind === 'travail' && <div className="notice"><strong>Un cadre professionnel :</strong> ce questionnaire explore des façons de reconnaître et soutenir le travail. Il n’inclut aucune forme de contact physique.</div>}
      <div className="progress-wrap"><span>Question {index + 1} sur 25</span><span>{answeredCount} réponse{answeredCount > 1 ? 's' : ''} enregistrée{answeredCount > 1 ? 's' : ''} sur cet appareil</span></div>
      <div className="progress-track" role="progressbar" aria-label="Progression du questionnaire" aria-valuemin={0} aria-valuemax={25} aria-valuenow={answeredCount}><div className="progress-fill" style={{ width: `${(answeredCount / 25) * 100}%` }} /></div>
      <section className="question-card" aria-labelledby="question-title">
        <div className="question-top"><span>Choix {String(index + 1).padStart(2, '0')}</span><span>Une seule réponse</span></div>
        <h2 id="question-title">{current.prompt} qu’est-ce qui vous ferait le plus de bien ?</h2>
        <div className="answer-grid">
          {(['a', 'b'] as const).map((key) => {
            const option = current[key];
            return <button type="button" key={key} onClick={() => choose(option)} className={`answer-option ${chosenOption === key ? 'selected' : ''}`} aria-pressed={chosenOption === key} data-testid={`choice-${key}-${index + 1}`}>
              <span className="choice-letter">{chosenOption === key ? <Check size={16} /> : key.toUpperCase()}</span><span>{option.text}</span>
            </button>;
          })}
        </div>
      </section>
      <div className="survey-controls"><button className="button button-light" onClick={() => index > 0 && setIndex(index - 1)} disabled={index === 0} data-testid="button-previous-question"><ChevronLeft size={16} /> Précédente</button><span className="small-note">Vos choix sont enregistrés automatiquement sur cet appareil.</span><div style={{ display: 'flex', gap: 8 }}><button className="button button-quiet" onClick={() => setConfirmClear(true)} data-testid="button-reset-survey">Recommencer</button><button className="button button-primary" onClick={goNext} disabled={!answer || priorUnanswered} data-testid="button-next-question">{index === 24 ? 'Voir mon résultat' : 'Suivant'} <ChevronRight size={16} /></button></div></div>
      <div className="small-note" style={{ marginTop: 18 }}>Explorez ce qui vous ressemble. Ce résultat est une invitation à en parler, pas une définition de qui vous êtes.</div>
    </main>
    <Footer />
    {confirmClear && <ConfirmDialog title="Recommencer ce questionnaire ?" description={`Toutes vos réponses au questionnaire ${kind} seront effacées de ce navigateur.`} onCancel={() => setConfirmClear(false)} onConfirm={clear} />}
  </>;
}

function Results({ kind, toast }: { kind: SurveyKind; toast: (message: string) => void }) {
  const [, navigate] = useLocation();
  const saved = readSaved(kind);
  const result = saved.result;
  const categories = categoriesFor(kind);
  const primary = result ? categories.find((category) => category.id === result.primary)! : null;
  const secondary = result ? categories.find((category) => category.id === result.secondary)! : null;
  const [confirmClear, setConfirmClear] = useState(false);
  const summary = result && primary && secondary ? [
    `Mon reflet ${kind === 'famille' ? 'en famille' : 'au travail'} — Profils d’appréciation`,
    `Ma préférence principale : ${primary.label} (${result.percentages[primary.id]} %).`,
    `Une préférence secondaire : ${secondary.label} (${result.percentages[secondary.id]} %).`,
    `Quelques gestes qui me feraient plaisir :\n- ${primary.examples[0]}\n- ${primary.examples[1]}\n- ${secondary.examples[0]}`,
    `Ce résultat est une aide à la réflexion, pas un test psychométrique validé ni un diagnostic. Il peut évoluer.`,
    'Les réponses restent dans le navigateur où le questionnaire a été rempli.',
  ].join('\n') : '';
  const copyResult = async () => {
    try { await navigator.clipboard.writeText(summary); toast('Résumé copié.'); }
    catch { toast('Copie indisponible dans ce navigateur.'); }
  };
  const emailResult = () => { window.location.href = `mailto:?subject=${encodeURIComponent(`Mon reflet ${kind === 'famille' ? 'en famille' : 'au travail'}`)}&body=${encodeURIComponent(summary)}`; };
  const reset = () => { localStorage.removeItem(storageKey(kind)); setConfirmClear(false); navigate(`/sondage-${kind}`); };
  if (!result || !primary || !secondary) return <>
    <Header /><main className="page-wrap"><div className="empty-state"><span className="brand-mark" style={{ margin: 'auto' }}><HeartHandshake size={21} /></span><h1>Votre reflet est en attente.</h1><p>Répondez aux 25 choix du questionnaire pour découvrir votre résultat. Vos réponses sont conservées uniquement sur cet appareil.</p><Link className="button button-primary" href={`/sondage-${kind}`}>Continuer le questionnaire <ArrowRight size={16} /></Link><div style={{ marginTop: 12 }}><button className="button button-quiet" onClick={() => { localStorage.removeItem(storageKey(kind)); toast('Réponses effacées.'); }} data-testid="button-clear-empty">Effacer les réponses enregistrées</button></div></div></main><Footer />
  </>;
  return <>
    <Header />
    <main className="page-wrap fade-in">
      <Link href="/" className="page-back"><ArrowLeft size={15} /> Retour à l’accueil</Link>
      <section className="result-hero">
        <span className="eyebrow">Votre reflet · {kind === 'famille' ? 'En famille' : 'Au travail'}</span>
        <h1>Vous vous sentez apprécié·e quand on vous <em style={{ color: '#cf8067', fontStyle: 'italic' }}>{primary.short.toLowerCase()}.</em></h1>
        <p>Votre préférence qui ressort le plus aujourd’hui est <strong>{primary.label.toLowerCase()}</strong>. Une autre façon de vous rejoindre compte aussi : <strong>{secondary.label.toLowerCase()}</strong>.</p>
      </section>
      <div className="result-content">
        <section className="result-panel"><span className="eyebrow">Vos cinq préférences</span><h2>Un aperçu, sans classement.</h2><p className="small-note">Les pourcentages représentent la part de choix associés à chaque façon de recevoir de l’attention. Ils ne mesurent pas votre valeur.</p>
          {categories.map((category) => <div className="score-row" key={category.id} data-testid={`score-${category.id}`}><div className="score-label"><strong>{category.label}</strong><span>{result.percentages[category.id]} %</span></div><div className="scorebar"><span style={{ width: `${result.percentages[category.id]}%`, background: category.color }} /></div></div>)}
        </section>
        <section className="result-panel"><span className="eyebrow">Pour en parler simplement</span><h2>Des gestes concrets</h2>
          {[primary, secondary].map((category, i) => <div className="insight" key={category.id}><span className="eyebrow">{i === 0 ? 'Ce qui vous rejoint souvent' : 'Une autre piste qui compte'}</span><h3>{category.label}</h3><p>{category.intro}</p><ul>{category.examples.map((example) => <li key={example}>{example}</li>)}</ul></div>)}
        </section>
      </div>
      {kind === 'famille' && <div className="notice"><strong>Rappel de consentement :</strong> l’affection physique ne convient que si elle est souhaitée par toutes les personnes concernées. Demandez, écoutez et respectez les limites, sans exception.</div>}
      <div className="notice"><strong>À garder en tête.</strong> Ceci est une aide à la réflexion, pas un test clinique ni un outil psychométrique validé. Vos préférences peuvent évoluer et ne résument pas votre personnalité. Ce projet n’est pas affilié à Gary Chapman ni à son éditeur.</div>
      <div className="result-actions"><button className="button button-primary" onClick={() => window.print()} data-testid="button-print-result"><Printer size={16} /> Imprimer / PDF</button><button className="button button-light" onClick={copyResult} data-testid="button-copy-result"><Link2 size={16} /> Copier le résumé</button><button className="button button-light" onClick={emailResult} data-testid="button-email-result"><Mail size={16} /> Préparer un courriel</button><Link className="button button-light" href={`/sondage-${kind}`}><RotateCcw size={16} /> Refaire le questionnaire</Link><button className="button button-quiet" onClick={() => setConfirmClear(true)} data-testid="button-delete-result">Effacer mon résultat</button></div>
      <p className="small-note" style={{ marginTop: 15 }}>« Préparer un courriel » ouvre votre application de messagerie avec le résumé prérempli. L’application n’envoie aucun message.</p>
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