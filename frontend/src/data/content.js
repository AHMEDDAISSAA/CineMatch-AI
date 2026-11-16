// Textes et données de la landing page (source : README du projet).

export const GITHUB_URL = "https://github.com/AHMEDDAISSAA/CineMatch-AI";
export const MOVIELENS_URL = "https://grouplens.org/datasets/movielens/";

export const NAV_LINKS = [
  { href: "#application", label: "Application" },
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#modeles", label: "Modèles" },
  { href: "#demo", label: "Démo" },
  { href: "#evaluation", label: "Évaluation" },
  { href: "#equipe", label: "Équipe" },
];

export const STATS = [
  { value: 100836, label: "notes analysées" },
  { value: 610, label: "utilisateurs" },
  { value: 9742, label: "films" },
  { value: 98.3, decimals: 1, suffix: " %", label: "de la matrice vide" },
];

export const STEPS = [
  {
    title: "Les données",
    text: "MovieLens Latest Small : notes, genres et tags. Les données sont nettoyées puis découpées dans le temps, utilisateur par utilisateur.",
  },
  {
    title: "Les modèles",
    text: "Un modèle par contenu (genres et tags), un modèle collaboratif (SVD), puis une combinaison des deux réglée par un poids alpha.",
  },
  {
    title: "La recommandation",
    text: "Un top 10 de films encore jamais vus, avec un score entre 0 et 1 et une explication : les genres en commun avec les films aimés.",
  },
];

export const APPROACHES = {
  hybrid: {
    title: "Recommandation hybride",
    text: "Le meilleur des deux mondes : ce qui ressemble à vos films préférés, et ce qu'aiment les personnes qui vous ressemblent. Le poids alpha est choisi sur le jeu de validation.",
  },
  items: [
    {
      icon: "content",
      title: "Filtrage par contenu",
      text: "TF-IDF sur les genres et les tags, puis similarité cosinus. Utile même pour un film peu noté.",
    },
    {
      icon: "collab",
      title: "Filtrage collaboratif",
      text: "Factorisation SVD de la matrice utilisateurs × films pour révéler des facteurs de goût cachés.",
    },
    {
      icon: "coldstart",
      title: "Nouvel utilisateur",
      text: "Pas encore de notes ? On choisit ses genres préférés et on reçoit un top 10 tout de suite.",
    },
    {
      icon: "supervised",
      title: "Volet A · supervisé",
      text: "Aime ou n'aime pas : KNN, SVM, régression logistique. Note prédite : linéaire, Ridge, arbre.",
    },
    {
      icon: "unsupervised",
      title: "Volet B · non supervisé",
      text: "Segmentation des utilisateurs par leurs goûts : ACP, K-Means, CAH et DBSCAN.",
    },
  ],
};

// Films réels de MovieLens (movieId, genres) avec des scores d'exemple pour
// illustrer le curseur alpha : ce ne sont pas des sorties de modèle.
export const SAMPLE_FILMS = [
  { id: 109487, title: "Interstellar", year: 2014, genres: ["Sci-Fi", "IMAX"], collab: 0.62, content: 0.95 },
  { id: 164179, title: "Arrival", year: 2016, genres: ["Sci-Fi"], collab: 0.48, content: 0.9 },
  { id: 176371, title: "Blade Runner 2049", year: 2017, genres: ["Sci-Fi"], collab: 0.55, content: 0.85 },
  { id: 296, title: "Pulp Fiction", year: 1994, genres: ["Comedy", "Crime", "Drama", "Thriller"], collab: 0.93, content: 0.35 },
  { id: 112552, title: "Whiplash", year: 2014, genres: ["Drama"], collab: 0.88, content: 0.3 },
  { id: 4973, title: "Amélie", year: 2001, genres: ["Comedy", "Romance"], collab: 0.8, content: 0.45 },
];

export const EVAL_RULES = [
  "Le Test n'est utilisé qu'une seule fois, à la toute fin.",
  "Les statistiques basées sur les notes sont calculées uniquement sur Train.",
  "Le poids alpha et les hyperparamètres sont réglés sur Validation.",
];

export const METRICS = [
  { name: "RMSE", group: "note" },
  { name: "MAE", group: "note" },
  { name: "Precision@10", group: "top" },
  { name: "Recall@10", group: "top" },
  { name: "NDCG@10", group: "top" },
];

export const STACK = ["Python", "pandas", "scikit-learn", "FastAPI", "React", "Three.js"];

export const TEAM = [
  { name: "Ahmed Aissa", role: "Chef de projet · moteur hybride · API FastAPI" },
  { name: "Asma Limayem", role: "Data Engineer · EDA et préparation des données" },
  { name: "Eya Hmad", role: "Filtrage par contenu · clustering (volet B)" },
  { name: "Aziz Jomaa", role: "Évaluation · volet A supervisé · SVD · frontend" },
];
