"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TestRouter_js_1 = __importDefault(require("./routes/TestRouter.js"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = 3000;
app.listen(PORT, (err) => {
    if (err)
        throw err;
});
app.use("/test", TestRouter_js_1.default);
//# sourceMappingURL=main.js.map