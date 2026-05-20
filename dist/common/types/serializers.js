"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMoney = toMoney;
exports.serializeUser = serializeUser;
exports.serializeCategory = serializeCategory;
exports.serializeAccount = serializeAccount;
exports.serializeTransaction = serializeTransaction;
function toMoney(value) {
    return Number(value ?? 0);
}
function serializeUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        currentBalance: toMoney(user.currentBalance),
        goalAmount: user.goalAmount == null ? null : toMoney(user.goalAmount),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
function serializeCategory(category) {
    return {
        ...category,
    };
}
function serializeAccount(account) {
    return {
        ...account,
        currentBalance: toMoney(account.currentBalance),
    };
}
function serializeTransaction(transaction) {
    return {
        ...transaction,
        amount: toMoney(transaction.amount),
        category: transaction.category ?? null,
        account: transaction.account
            ? serializeAccount(transaction.account)
            : null,
    };
}
//# sourceMappingURL=serializers.js.map