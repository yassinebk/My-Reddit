"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (options) => {
    var _a;
    console.log(options);
    if (!((_a = options.email) === null || _a === void 0 ? void 0 : _a.includes("@"))) {
        return [
            {
                field: "email",
                message: "invalid email",
            },
        ];
    }
    if (options.username.length <= 2) {
        return [
            {
                field: "username",
                message: "username shouldn't be less than 2 characters",
            },
        ];
    }
    if (options.password.length < 2) {
        return [
            {
                field: "password",
                message: "password shouldn't be empty",
            },
        ];
    }
    return null;
};
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map