const mongoose = require('mongoose');
const { Schema } = mongoose;

const competenceSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const utilisateurSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    motDePasse: { type: String, required: true },
    role: {
      type: String,
      enum: ['etudiant', 'enseignant', 'bureau_executif'],
      required: true,
    },
    niveau: {
      type: String,
      required() {
        return this.role === 'etudiant';
      },
    },
    filiere: {
      type: String,
      required() {
        return this.role === 'etudiant';
      },
    },
    grade: {
      type: String,
      required() {
        return this.role === 'enseignant';
      },
    },
    specialite: { type: String },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required() {
        return this.role === 'bureau_executif';
      },
    },
    competenceIds: [{ type: Schema.Types.ObjectId, ref: 'Competence' }],
  },
  { timestamps: true }
);

const clubSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    description: { type: String },
    specialite: { type: String },
    dateCreation: { type: Date, default: Date.now },
    statut: {
      type: String,
      enum: ['actif', 'inactif', 'suspendu'],
      default: 'actif',
    },
    bureauExecutifId: {
      type: Schema.Types.ObjectId,
      ref: 'Utilisateur',
    },
    membreIds: [{ type: Schema.Types.ObjectId, ref: 'Utilisateur' }],
  },
  { timestamps: true }
);

const projetSchema = new Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String },
    objectif: { type: String },
    dateDebut: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },
    statut: {
      type: String,
      enum: ['en_cours', 'termine', 'annule', 'en_attente'],
      default: 'en_attente',
    },
    progression: { type: Number, min: 0, max: 100, default: 0 },
    enseignantId: {
      type: Schema.Types.ObjectId,
      ref: 'Utilisateur',
      required: true,
    },
    etudiantIds: [{ type: Schema.Types.ObjectId, ref: 'Utilisateur' }],
    clubId: { type: Schema.Types.ObjectId, ref: 'Club' },
  },
  { timestamps: true }
);

const tacheSchema = new Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String },
    deadline: { type: Date, required: true },
    statut: {
      type: String,
      enum: ['a_faire', 'en_cours', 'terminee'],
      default: 'a_faire',
    },
    projetId: {
      type: Schema.Types.ObjectId,
      ref: 'Projet',
      required: true,
    },
    etudiantIds: [{ type: Schema.Types.ObjectId, ref: 'Utilisateur' }],
  },
  { timestamps: true }
);

const evenementSchema = new Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String },
    date: { type: Date, required: true },
    lieu: { type: String },
    capacite: { type: Number, min: 1 },
    participantsCount: { type: Number, min: 0, default: 0 },
    type: {
      type: String,
      enum: ['conference', 'atelier', 'hackathon', 'sortie', 'autre'],
      default: 'autre',
    },
    organisateurId: {
      type: Schema.Types.ObjectId,
      ref: 'Utilisateur',
      required: true,
    },
  },
  { timestamps: true }
);

const participationEvenementSchema = new Schema(
  {
    evenementId: {
      type: Schema.Types.ObjectId,
      ref: 'Evenement',
      required: true,
    },
    utilisateurId: {
      type: Schema.Types.ObjectId,
      ref: 'Utilisateur',
      required: true,
    },
    dateInscription: { type: Date, default: Date.now },
    statut: {
      type: String,
      enum: ['inscrit', 'confirme', 'annule', 'present'],
      default: 'inscrit',
    },
    commentaire: { type: String },
  },
  { timestamps: true }
);

participationEvenementSchema.index(
  { evenementId: 1, utilisateurId: 1 },
  { unique: true }
);

const Competence = mongoose.model('Competence', competenceSchema);
const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);
const Club = mongoose.model('Club', clubSchema);
const Projet = mongoose.model('Projet', projetSchema);
const Tache = mongoose.model('Tache', tacheSchema);
const Evenement = mongoose.model('Evenement', evenementSchema);
const ParticipationEvenement = mongoose.model(
  'ParticipationEvenement',
  participationEvenementSchema
);

module.exports = {
  Competence,
  Utilisateur,
  Club,
  Projet,
  Tache,
  Evenement,
  ParticipationEvenement,
};
