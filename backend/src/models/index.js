const mongoose = require('mongoose');
const { Schema } = mongoose;

function slugifyCompetenceName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const competenceSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

competenceSchema.pre('validate', function setCompetenceSlug(next) {
  if (this.nom) {
    this.slug = slugifyCompetenceName(this.nom);
  }

  next();
});

competenceSchema.index({ slug: 1 }, { unique: true });

const utilisateurSchema = new Schema(
  {
    nom: {
      type: String,
      trim: true,
      required() {
        return this.role !== 'club';
      },
    },
    prenom: {
      type: String,
      trim: true,
      required() {
        return this.role !== 'club';
      },
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    motDePasse: { type: String, required: true },
    role: {
      type: String,
      enum: ['etudiant', 'enseignant', 'club', 'admin'],
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
    avatarUrl: { type: String, trim: true },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required() {
        return this.role === 'club';
      },
    },
    competenceIds: [{ type: Schema.Types.ObjectId, ref: 'Competence' }],
  },
  { timestamps: true }
);

utilisateurSchema.index({ competenceIds: 1 });

const pendingRegistrationSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    passwordHash: { type: String, required: true },
    nom: { type: String, trim: true },
    prenom: { type: String, trim: true },
    role: {
      type: String,
      enum: ['etudiant', 'enseignant', 'club'],
      required: true,
    },
    niveau: { type: String },
    filiere: { type: String },
    grade: { type: String },
    avatarUrl: { type: String, trim: true },
    clubName: { type: String, trim: true },
    clubDescription: { type: String },
    clubSpecialite: { type: String },
    competenceIds: [{ type: Schema.Types.ObjectId, ref: 'Competence' }],
    emailVerificationCodeHash: { type: String, required: true },
    emailVerificationCodeExpiresAt: { type: Date, required: true },
    emailVerificationRequestedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const passwordResetTokenSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    requestedAt: { type: Date, default: Date.now },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ email: 1, createdAt: -1 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

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

const clubMembershipRequestSchema = new Schema(
  {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Utilisateur',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Utilisateur',
      default: null,
    },
  },
  { timestamps: true }
);

clubMembershipRequestSchema.index({ clubId: 1, memberId: 1 }, { unique: true });
clubMembershipRequestSchema.index({ clubId: 1, status: 1, requestedAt: -1 });
clubMembershipRequestSchema.index({ memberId: 1, status: 1, requestedAt: -1 });

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
    competenceIds: [{ type: Schema.Types.ObjectId, ref: 'Competence' }],
  },
  { timestamps: true }
);

projetSchema.index({ competenceIds: 1 });

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
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    competenceIds: [{ type: Schema.Types.ObjectId, ref: 'Competence' }],
    coOrganizerClubIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Club',
    }],
  },
  { timestamps: true }
);

evenementSchema.index({ clubId: 1, date: -1 });
evenementSchema.index({ coOrganizerClubIds: 1, date: -1 });
evenementSchema.index({ competenceIds: 1, date: -1 });
evenementSchema.index({ date: -1 });

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
const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);
const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
const Club = mongoose.model('Club', clubSchema);
const ClubMembershipRequest = mongoose.model('ClubMembershipRequest', clubMembershipRequestSchema);
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
  PendingRegistration,
  PasswordResetToken,
  Club,
  ClubMembershipRequest,
  Projet,
  Tache,
  Evenement,
  ParticipationEvenement,
};
