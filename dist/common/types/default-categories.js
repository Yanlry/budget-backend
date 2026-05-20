"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CATEGORIES = void 0;
const client_1 = require("@prisma/client");
exports.DEFAULT_CATEGORIES = [
    {
        name: 'Logement',
        type: client_1.TransactionType.EXPENSE,
        color: '#4B5563',
        icon: 'home',
    },
    {
        name: 'Alimentation',
        type: client_1.TransactionType.EXPENSE,
        color: '#059669',
        icon: 'shopping-cart',
    },
    {
        name: 'Transport',
        type: client_1.TransactionType.EXPENSE,
        color: '#0EA5E9',
        icon: 'truck',
    },
    {
        name: 'Abonnements',
        type: client_1.TransactionType.EXPENSE,
        color: '#8B5CF6',
        icon: 'repeat',
    },
    {
        name: 'Loisirs',
        type: client_1.TransactionType.EXPENSE,
        color: '#F59E0B',
        icon: 'smile',
    },
    {
        name: 'Sante',
        type: client_1.TransactionType.EXPENSE,
        color: '#EC4899',
        icon: 'activity',
    },
    {
        name: 'Impots',
        type: client_1.TransactionType.EXPENSE,
        color: '#EF4444',
        icon: 'percent',
    },
    {
        name: 'Credit',
        type: client_1.TransactionType.EXPENSE,
        color: '#7C3AED',
        icon: 'credit-card',
    },
    {
        name: 'Epargne',
        type: client_1.TransactionType.EXPENSE,
        color: '#14B8A6',
        icon: 'target',
    },
    { name: 'Autre', type: null, color: '#6B7280', icon: 'tag' },
    {
        name: 'Salaire',
        type: client_1.TransactionType.INCOME,
        color: '#16A34A',
        icon: 'dollar-sign',
    },
    {
        name: 'Prime',
        type: client_1.TransactionType.INCOME,
        color: '#10B981',
        icon: 'gift',
    },
];
//# sourceMappingURL=default-categories.js.map